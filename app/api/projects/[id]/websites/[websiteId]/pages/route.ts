import { NextRequest, NextResponse } from 'next/server';
import { createFramework } from '@/lib/config/database';

/**
 * GET /api/projects/[id]/websites/[websiteId]/pages - Get crawled pages for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; websiteId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { websiteId } = resolvedParams;
    
    const framework = await createFramework();
    
    // Get all pages for this website
    const pagesQuery = `
      SELECT 
        id,
        url,
        title,
        content,
        depth,
        word_count,
        link_count,
        scraping_status,
        discovered_at,
        scraped_at,
        created_at
      FROM pages 
      WHERE website_id = $1 
      ORDER BY depth ASC, created_at ASC
    `;
    
    const result = await framework.executeQuery(pagesQuery, [websiteId]);
    
    await framework.dispose();
    
    if (!result.success) {
      throw new Error('Failed to fetch pages');
    }

    const pages = (result.rows || []).map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      content: row.content,
      depth: row.depth || 0,
      wordCount: row.word_count || 0,
      linkCount: row.link_count || 0,
      status: row.scraping_status || 'crawled',
      discoveredAt: row.discovered_at,
      scrapedAt: row.scraped_at,
      createdAt: row.created_at
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        websiteId,
        totalPages: pages.length,
        pages
      }
    });
    
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch pages' 
      },
      { status: 500 }
    );
  }
} 