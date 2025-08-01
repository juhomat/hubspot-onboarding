import { ApplicationFramework } from '@juhomat/hexagonal-ai-framework';

// Website interfaces - Enhanced with crawling capabilities
export interface Website {
  id: string;
  project_id: string;
  url: string;
  name?: string;
  description?: string;
  status: WebsiteStatus;
  // New crawling fields
  crawl_status: CrawlStatus;
  total_pages_discovered: number;
  pages_crawled: number;
  pages_failed: number;
  max_pages: number;
  max_depth: number;
  started_at?: Date;
  completed_at?: Date;
  created_date: Date;
  updated_at: Date;
}

export type WebsiteStatus = 'active' | 'inactive' | 'pending_review';
export type CrawlStatus = 'pending' | 'crawling' | 'completed' | 'failed' | 'paused';
export type PageStatus = 'pending' | 'crawled' | 'failed' | 'processing' | 'chunked' | 'vectorized';
export type ChunkingMethod = 'recursive' | 'character' | 'token' | 'semantic';

// Page interface for individual crawled pages
export interface Page {
  id: string;
  website_id: string;
  url: string;
  title?: string;
  content?: string;
  raw_html?: string;
  depth: number;
  word_count: number;
  link_count: number;
  content_hash?: string;
  scraping_status: PageStatus;
  discovered_at?: Date;
  scraped_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Chunk interface for text chunks with embeddings
export interface Chunk {
  id: string;
  page_id: string;
  content: string;
  chunk_index: number;
  start_position?: number;
  end_position?: number;
  word_count?: number;
  chunking_method: ChunkingMethod;
  embedding?: number[]; // Vector embedding
  embedding_created_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWebsiteRequest {
  project_id: string;
  url: string;
  name?: string;
  description?: string;
  status?: WebsiteStatus;
  max_pages?: number;
  max_depth?: number;
}

export interface UpdateWebsiteRequest {
  url?: string;
  name?: string;
  description?: string;
  status?: WebsiteStatus;
  crawl_status?: CrawlStatus;
  max_pages?: number;
  max_depth?: number;
}

export interface WebsiteStats {
  total_websites: number;
  active_websites: number;
  inactive_websites: number;
  pending_review_websites: number;
  crawling_websites: number;
  completed_crawls: number;
}

// Crawl progress interface
export interface CrawlProgress {
  website_id: string;
  project_id: string;
  website_url: string;
  website_name?: string;
  crawl_status: CrawlStatus;
  total_pages_discovered: number;
  pages_crawled: number;
  pages_failed: number;
  max_pages: number;
  max_depth: number;
  started_at?: Date;
  completed_at?: Date;
  actual_pages_count: number;
  pending_pages: number;
  crawled_pages: number;
  failed_pages: number;
  processing_pages: number;
  chunked_pages: number;
  vectorized_pages: number;
  crawl_progress_percent: number;
}

export class WebsiteService {
  constructor(private framework: ApplicationFramework) {}

  async getWebsitesByProject(projectId: string): Promise<Website[]> {
    const query = `
      SELECT 
        id,
        project_id,
        url,
        name,
        description,
        status,
        crawl_status,
        total_pages_discovered,
        pages_crawled,
        pages_failed,
        max_pages,
        max_depth,
        started_at,
        completed_at,
        created_date,
        updated_at
      FROM websites 
      WHERE project_id = $1 
      ORDER BY created_date ASC
    `;
    
    const result = await this.framework.executeQuery(query, [projectId]);
    return result.rows?.map(row => this.mapRowToWebsite(row)) || [];
  }

  async getWebsiteById(id: string): Promise<Website | null> {
    const query = `
      SELECT 
        id,
        project_id,
        url,
        name,
        description,
        status,
        crawl_status,
        total_pages_discovered,
        pages_crawled,
        pages_failed,
        max_pages,
        max_depth,
        started_at,
        completed_at,
        created_date,
        updated_at
      FROM websites 
      WHERE id = $1
    `;
    
    const result = await this.framework.executeQuery(query, [id]);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToWebsite(result.rows[0]);
  }

  async createWebsite(websiteData: CreateWebsiteRequest): Promise<Website> {
    const query = `
      INSERT INTO websites (
        project_id, 
        url, 
        name, 
        description, 
        status, 
        max_pages, 
        max_depth
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        project_id,
        url,
        name,
        description,
        status,
        crawl_status,
        total_pages_discovered,
        pages_crawled,
        pages_failed,
        max_pages,
        max_depth,
        started_at,
        completed_at,
        created_date,
        updated_at
    `;
    
    const values = [
      websiteData.project_id,
      websiteData.url,
      websiteData.name || null,
      websiteData.description || null,
      websiteData.status || 'active',
      websiteData.max_pages || 30,
      websiteData.max_depth || 3
    ];
    
    const result = await this.framework.executeQuery(query, values);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to create website');
    }
    return this.mapRowToWebsite(result.rows[0]);
  }

  async updateWebsite(id: string, updateData: UpdateWebsiteRequest): Promise<Website | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.url !== undefined) {
      setClauses.push(`url = $${paramIndex++}`);
      values.push(updateData.url);
    }
    
    if (updateData.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }
    
    if (updateData.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }
    
    if (updateData.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (updateData.crawl_status !== undefined) {
      setClauses.push(`crawl_status = $${paramIndex++}`);
      values.push(updateData.crawl_status);
    }

    if (updateData.max_pages !== undefined) {
      setClauses.push(`max_pages = $${paramIndex++}`);
      values.push(updateData.max_pages);
    }

    if (updateData.max_depth !== undefined) {
      setClauses.push(`max_depth = $${paramIndex++}`);
      values.push(updateData.max_depth);
    }

    if (setClauses.length === 0) {
      return this.getWebsiteById(id);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE websites 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        project_id,
        url,
        name,
        description,
        status,
        crawl_status,
        total_pages_discovered,
        pages_crawled,
        pages_failed,
        max_pages,
        max_depth,
        started_at,
        completed_at,
        created_date,
        updated_at
    `;
    
    const result = await this.framework.executeQuery(query, values);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToWebsite(result.rows[0]);
  }

  async deleteWebsite(id: string): Promise<boolean> {
    const query = 'DELETE FROM websites WHERE id = $1';
    const result = await this.framework.executeQuery(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async getWebsitesByStatus(status: WebsiteStatus): Promise<Website[]> {
    const query = `
      SELECT 
        id,
        project_id,
        url,
        name,
        description,
        status,
        crawl_status,
        total_pages_discovered,
        pages_crawled,
        pages_failed,
        max_pages,
        max_depth,
        started_at,
        completed_at,
        created_date,
        updated_at
      FROM websites 
      WHERE status = $1 
      ORDER BY created_date DESC
    `;
    
    const result = await this.framework.executeQuery(query, [status]);
    return result.rows?.map(row => this.mapRowToWebsite(row)) || [];
  }

  async getWebsiteStats(projectId?: string): Promise<WebsiteStats> {
    let query = `
      SELECT 
        COUNT(*) as total_websites,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_websites,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_websites,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review_websites,
        COUNT(CASE WHEN crawl_status = 'crawling' THEN 1 END) as crawling_websites,
        COUNT(CASE WHEN crawl_status = 'completed' THEN 1 END) as completed_crawls
      FROM websites
    `;
    
    const params: any[] = [];
    
    if (projectId) {
      query += ' WHERE project_id = $1';
      params.push(projectId);
    }
    
    const result = await this.framework.executeQuery(query, params);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to get website stats');
    }
    const row = result.rows[0];
    
    return {
      total_websites: parseInt(row.total_websites),
      active_websites: parseInt(row.active_websites),
      inactive_websites: parseInt(row.inactive_websites),
      pending_review_websites: parseInt(row.pending_review_websites),
      crawling_websites: parseInt(row.crawling_websites),
      completed_crawls: parseInt(row.completed_crawls)
    };
  }

  // New methods for crawling functionality

  async getCrawlProgress(websiteId: string): Promise<CrawlProgress | null> {
    const query = `
      SELECT * FROM website_crawl_progress WHERE website_id = $1
    `;
    
    const result = await this.framework.executeQuery(query, [websiteId]);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      website_id: row.website_id,
      project_id: row.project_id,
      website_url: row.website_url,
      website_name: row.website_name,
      crawl_status: row.crawl_status,
      total_pages_discovered: parseInt(row.total_pages_discovered || '0'),
      pages_crawled: parseInt(row.pages_crawled || '0'),
      pages_failed: parseInt(row.pages_failed || '0'),
      max_pages: parseInt(row.max_pages || '30'),
      max_depth: parseInt(row.max_depth || '3'),
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      actual_pages_count: parseInt(row.actual_pages_count || '0'),
      pending_pages: parseInt(row.pending_pages || '0'),
      crawled_pages: parseInt(row.crawled_pages || '0'),
      failed_pages: parseInt(row.failed_pages || '0'),
      processing_pages: parseInt(row.processing_pages || '0'),
      chunked_pages: parseInt(row.chunked_pages || '0'),
      vectorized_pages: parseInt(row.vectorized_pages || '0'),
      crawl_progress_percent: parseFloat(row.crawl_progress_percent || '0')
    };
  }

  async updateCrawlStatus(websiteId: string, status: CrawlStatus, stats?: {
    total_pages_discovered?: number;
    pages_crawled?: number;
    pages_failed?: number;
  }): Promise<void> {
    const setClauses = ['crawl_status = $2'];
    const values: (string | number)[] = [websiteId, status];
    let paramIndex = 3;

    if (stats?.total_pages_discovered !== undefined) {
      setClauses.push(`total_pages_discovered = $${paramIndex++}`);
      values.push(stats.total_pages_discovered);
    }

    if (stats?.pages_crawled !== undefined) {
      setClauses.push(`pages_crawled = $${paramIndex++}`);
      values.push(stats.pages_crawled);
    }

    if (stats?.pages_failed !== undefined) {
      setClauses.push(`pages_failed = $${paramIndex++}`);
      values.push(stats.pages_failed);
    }

    if (status === 'crawling') {
      setClauses.push(`started_at = CURRENT_TIMESTAMP`);
    } else if (status === 'completed' || status === 'failed') {
      setClauses.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    const query = `
      UPDATE websites 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.framework.executeQuery(query, values);
  }

  async validateWebsiteUrl(url: string): Promise<boolean> {
    // Basic URL validation (more sophisticated validation is done at DB level)
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  async checkDuplicateUrl(projectId: string, url: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM websites WHERE project_id = $1 AND url = $2';
    const params = [projectId, url];
    
    if (excludeId) {
      query += ' AND id != $3';
      params.push(excludeId);
    }
    
    const result = await this.framework.executeQuery(query, params);
    if (!result.rows || result.rows.length === 0) {
      return false;
    }
    return parseInt(result.rows[0].count) > 0;
  }

  private mapRowToWebsite(row: any): Website {
    return {
      id: row.id,
      project_id: row.project_id,
      url: row.url,
      name: row.name,
      description: row.description,
      status: row.status as WebsiteStatus,
      crawl_status: row.crawl_status as CrawlStatus,
      total_pages_discovered: parseInt(row.total_pages_discovered || '0'),
      pages_crawled: parseInt(row.pages_crawled || '0'),
      pages_failed: parseInt(row.pages_failed || '0'),
      max_pages: parseInt(row.max_pages || '30'),
      max_depth: parseInt(row.max_depth || '3'),
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      created_date: new Date(row.created_date),
      updated_at: new Date(row.updated_at)
    };
  }
} 