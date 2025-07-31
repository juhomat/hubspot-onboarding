import { ApplicationFramework } from '@juhomat/hexagonal-ai-framework';

// Website interfaces
export interface Website {
  id: string;
  project_id: string;
  url: string;
  name?: string;
  description?: string;
  status: WebsiteStatus;
  indexing_status: IndexingStatus;
  indexed_at?: string;
  indexing_error?: string;
  content_chunks: number;
  last_crawled_at?: string;
  created_date: Date;
  updated_at: Date;
}

export type WebsiteStatus = 'active' | 'inactive' | 'pending_review';
export type IndexingStatus = 'not_indexed' | 'indexing' | 'indexed' | 'failed';

export interface CreateWebsiteRequest {
  project_id: string;
  url: string;
  name?: string;
  description?: string;
  status?: WebsiteStatus;
  indexing_status?: IndexingStatus;
}

export interface UpdateWebsiteRequest {
  url?: string;
  name?: string;
  description?: string;
  status?: WebsiteStatus;
  indexing_status?: IndexingStatus;
  indexed_at?: string;
  indexing_error?: string;
  content_chunks?: number;
  last_crawled_at?: string;
}

export interface WebsiteStats {
  total_websites: number;
  active_websites: number;
  inactive_websites: number;
  pending_review_websites: number;
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
        indexing_status,
        indexed_at,
        indexing_error,
        content_chunks,
        last_crawled_at,
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
        indexing_status,
        indexed_at,
        indexing_error,
        content_chunks,
        last_crawled_at,
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
      INSERT INTO websites (project_id, url, name, description, status, indexing_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        project_id,
        url,
        name,
        description,
        status,
        indexing_status,
        indexed_at,
        indexing_error,
        content_chunks,
        last_crawled_at,
        created_date,
        updated_at
    `;
    
    const values = [
      websiteData.project_id,
      websiteData.url,
      websiteData.name || null,
      websiteData.description || null,
      websiteData.status || 'active',
      websiteData.indexing_status || 'not_indexed'
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
    
    if (updateData.indexing_status !== undefined) {
      setClauses.push(`indexing_status = $${paramIndex++}`);
      values.push(updateData.indexing_status);
    }
    
    if (updateData.indexed_at !== undefined) {
      setClauses.push(`indexed_at = $${paramIndex++}`);
      values.push(updateData.indexed_at);
    }
    
    if (updateData.indexing_error !== undefined) {
      setClauses.push(`indexing_error = $${paramIndex++}`);
      values.push(updateData.indexing_error);
    }
    
    if (updateData.content_chunks !== undefined) {
      setClauses.push(`content_chunks = $${paramIndex++}`);
      values.push(updateData.content_chunks);
    }
    
    if (updateData.last_crawled_at !== undefined) {
      setClauses.push(`last_crawled_at = $${paramIndex++}`);
      values.push(updateData.last_crawled_at);
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
        indexing_status,
        indexed_at,
        indexing_error,
        content_chunks,
        last_crawled_at,
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
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review_websites
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
      pending_review_websites: parseInt(row.pending_review_websites)
    };
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
      indexing_status: row.indexing_status as IndexingStatus,
      indexed_at: row.indexed_at,
      indexing_error: row.indexing_error,
      content_chunks: row.content_chunks || 0,
      last_crawled_at: row.last_crawled_at,
      created_date: new Date(row.created_date),
      updated_at: new Date(row.updated_at)
    };
  }
} 