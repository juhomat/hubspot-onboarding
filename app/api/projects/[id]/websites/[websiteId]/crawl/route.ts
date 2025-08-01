import { NextRequest, NextResponse } from 'next/server';
import { createFramework } from '@/lib/config/database';
import { WebsiteService } from '@/lib/services/WebsiteService';

// Helper function to extract clean text from HTML using framework ContentProcessor
function extractTextFromHtml(html: string, framework: any): string {
  if (!html) return '';
  
  // Try to use framework's ContentProcessor if available
  try {
    if (framework.contentProcessor && framework.contentProcessor.extractMainContent) {
      return framework.contentProcessor.extractMainContent(html);
    } else if (framework.extractMainContent) {
      return framework.extractMainContent(html);
    }
  } catch (error) {
    console.warn('Framework content extraction failed, falling back to manual extraction:', error);
  }
  
  // Fallback to manual HTML text extraction
  let cleanText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanText = cleanText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanText = cleanText.replace(/<[^>]+>/g, ' ');
  cleanText = cleanText.replace(/&nbsp;/g, ' ');
  cleanText = cleanText.replace(/&amp;/g, '&');
  cleanText = cleanText.replace(/&lt;/g, '<');
  cleanText = cleanText.replace(/&gt;/g, '>');
  cleanText = cleanText.replace(/&quot;/g, '"');
  cleanText = cleanText.replace(/&#39;/g, "'");
  cleanText = cleanText.replace(/\s+/g, ' ');
  
  return cleanText.trim();
}

/**
 * POST /api/projects/[id]/websites/[websiteId]/crawl - Start website crawling
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; websiteId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { websiteId } = resolvedParams;
    const body = await request.json();
    
    // Get crawling configuration from environment or use defaults
    const maxPages = body.maxPages || parseInt(process.env.CRAWL_MAX_PAGES || '10');
    const maxDepth = body.maxDepth || parseInt(process.env.CRAWL_MAX_DEPTH || '2');
    const delay = parseInt(process.env.CRAWL_DELAY || '1000');
    
    const framework = await createFramework();
    const websiteService = new WebsiteService(framework);
    
    // Get the website to verify it exists
    const website = await websiteService.getWebsiteById(websiteId);
    if (!website) {
      await framework.dispose();
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    // Check if already crawling
    if (website.crawl_status === 'crawling') {
      await framework.dispose();
      return NextResponse.json(
        { error: 'Website is already being crawled' },
        { status: 409 }
      );
    }
    
    // Update crawl status to "crawling"
    await websiteService.updateCrawlStatus(websiteId, 'crawling');
    
    // Start the crawling process
    console.log(`Starting crawl for website: ${website.url} (max pages: ${maxPages}, max depth: ${maxDepth})`);
    
    try {
      // Use the framework's crawling capabilities
      const crawlResult = await framework.discoverCrawlablePages(website.url, {
        maxPages,
        maxDepth,
        followExternalLinks: false,
        delay,
        includePatterns: [],
        excludePatterns: [
          '/admin/*',
          '/wp-admin/*',
          '*.pdf',
          '*.jpg',
          '*.png',
          '*.gif',
          '*.css',
          '*.js'
        ]
      });
      
      console.log(`Crawl completed for ${website.url}:`, crawlResult);
      
      // Store discovered pages in the database
      let savedPages = 0;
      let failedPages = 0;
      
      const pages = crawlResult.data?.pages || [];
      
      for (const page of pages) {
        try {
          // Debug: log basic page info
          console.log(`Processing page: ${page.url} (depth: ${page.depth})`);
          
          // Step 2: Scrape full content for each discovered page
          let pageContent = null;
          let rawHtml = null;
          let actualWordCount = page.wordCount || 0;
          
          try {
            console.log(`Scraping full content for: ${page.url}`);
            
            // Try to scrape the page content using framework methods
            const scrapedData = await framework.scrapeWebPage(page.url);
            if (scrapedData && scrapedData.content) {
              // The framework returns HTML in the content field
              rawHtml = scrapedData.content;
              
              // Extract clean text from HTML using the framework's ContentProcessor
              pageContent = extractTextFromHtml(scrapedData.content, framework);
              
              // Update word count with actual clean text content
              if (pageContent) {
                actualWordCount = pageContent.split(/\s+/).filter((word: string) => word.length > 0).length;
              }
              console.log(`Successfully scraped content: ${pageContent?.length || 0} chars text, ${rawHtml?.length || 0} chars HTML`);
            }
          } catch (scrapeError) {
            console.warn(`Failed to scrape content for ${page.url}:`, scrapeError);
            // Continue with basic info even if content scraping fails
          }
          
          const pageQuery = `
            INSERT INTO pages (
              website_id, 
              url, 
              title, 
              content, 
              raw_html, 
              depth, 
              word_count, 
              link_count,
              scraping_status,
              discovered_at,
              scraped_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (website_id, url) 
            DO UPDATE SET
              title = EXCLUDED.title,
              content = EXCLUDED.content,
              raw_html = EXCLUDED.raw_html,
              word_count = EXCLUDED.word_count,
              link_count = EXCLUDED.link_count,
              scraping_status = EXCLUDED.scraping_status,
              scraped_at = EXCLUDED.scraped_at,
              updated_at = CURRENT_TIMESTAMP
          `;
          
          await framework.executeQuery(pageQuery, [
            websiteId,
            page.url,
            page.title || null,
            pageContent, // Save scraped content
            rawHtml, // Save scraped raw HTML
            page.depth || 0,
            actualWordCount,
            page.linkCount || 0,
            'crawled',
            new Date().toISOString(),
            new Date().toISOString()
          ]);
          
          savedPages++;
        } catch (pageError) {
          console.error(`Failed to save page ${page.url}:`, pageError);
          failedPages++;
        }
      }
      
      // Update website crawl statistics
      await websiteService.updateCrawlStatus(websiteId, 'completed', {
        total_pages_discovered: pages.length,
        pages_crawled: savedPages,
        pages_failed: failedPages
      });
      
      await framework.dispose();
      
      return NextResponse.json({
        success: true,
        message: 'Website crawling completed successfully',
        data: {
          websiteId,
          totalPages: pages.length,
          savedPages,
          failedPages,
          crawlData: crawlResult.data
        }
      });
      
    } catch (crawlError) {
      console.error('Crawling failed:', crawlError);
      
      // Update status to failed
      await websiteService.updateCrawlStatus(websiteId, 'failed');
      
      await framework.dispose();
      
      return NextResponse.json(
        { 
          error: 'Failed to crawl website',
          details: crawlError instanceof Error ? crawlError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      { error: 'Failed to start crawling' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/websites/[websiteId]/crawl - Get crawl status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; websiteId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { websiteId } = resolvedParams;
    
    const framework = await createFramework();
    const websiteService = new WebsiteService(framework);
    
    const progress = await websiteService.getCrawlProgress(websiteId);
    
    await framework.dispose();
    
    if (!progress) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: progress
    });
    
  } catch (error) {
    console.error('Error getting crawl status:', error);
    return NextResponse.json(
      { error: 'Failed to get crawl status' },
      { status: 500 }
    );
  }
} 