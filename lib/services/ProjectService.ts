import { ApplicationFramework } from '@juhomat/hexagonal-ai-framework';

// Types for our Projects domain
export interface Project {
  id: string;
  name: string;
  customer: string;
  created_date: string;
  project_start_date: string | null;
  project_owner: string;
  hubspot_hubs: HubSpotHub[];
  status: ProjectStatus;
  description: string | null;
  updated_at: string;
}

export type ProjectStatus = 'pending' | 'active' | 'completed' | 'on_hold' | 'cancelled';

export type HubSpotHub = 
  | 'marketing_hub' 
  | 'sales_hub' 
  | 'service_hub' 
  | 'operations_hub'
  | 'hubspot_crm'
  | 'commerce_hub'
  | 'content_hub';

export interface CreateProjectRequest {
  name: string;
  customer: string;
  project_start_date?: string;
  project_owner: string;
  hubspot_hubs?: HubSpotHub[];
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  customer?: string;
  project_start_date?: string;
  project_owner?: string;
  hubspot_hubs?: HubSpotHub[];
  status?: ProjectStatus;
  description?: string;
}

export class ProjectService {
  constructor(private framework: ApplicationFramework) {}

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    const sql = `
      SELECT 
        id,
        name,
        customer,
        created_date,
        project_start_date,
        project_owner,
        hubspot_hubs,
        status,
        description,
        updated_at
      FROM projects 
      ORDER BY created_date DESC
    `;

    const result = await this.framework.executeQuery(sql);
    
    if (!result.success) {
      throw new Error(`Failed to fetch projects: ${result.error}`);
    }

    // Parse the hubspot_hubs array data
    const projects = (result.rows || []).map(row => ({
      ...row,
      hubspot_hubs: this.parseHubSpotHubs(row.hubspot_hubs)
    }));

    return projects;
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    const sql = `
      SELECT 
        id,
        name,
        customer,
        created_date,
        project_start_date,
        project_owner,
        hubspot_hubs,
        status,
        description,
        updated_at
      FROM projects 
      WHERE id = $1
    `;

    const result = await this.framework.executeQuery(sql, [id]);
    
    if (!result.success) {
      throw new Error(`Failed to fetch project: ${result.error}`);
    }

    const project = result.rows?.[0];
    if (!project) return null;

    return {
      ...project,
      hubspot_hubs: this.parseHubSpotHubs(project.hubspot_hubs)
    };
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const sql = `
      INSERT INTO projects (
        name,
        customer,
        project_start_date,
        project_owner,
        hubspot_hubs,
        description
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        name,
        customer,
        created_date,
        project_start_date,
        project_owner,
        hubspot_hubs,
        status,
        description,
        updated_at
    `;

    const result = await this.framework.executeQuery(sql, [
      projectData.name,
      projectData.customer,
      projectData.project_start_date || null,
      projectData.project_owner,
      projectData.hubspot_hubs || [],
      projectData.description || null
    ]);

    if (!result.success) {
      throw new Error(`Failed to create project: ${result.error}`);
    }

    if (!result.rows?.[0]) {
      throw new Error('Project created but no data returned');
    }

    const project = result.rows[0];
    return {
      ...project,
      hubspot_hubs: this.parseHubSpotHubs(project.hubspot_hubs)
    };
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    // Build dynamic update query
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setFields.length === 0) {
      throw new Error('No fields to update');
    }

    const sql = `
      UPDATE projects 
      SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        name,
        customer,
        created_date,
        project_start_date,
        project_owner,
        hubspot_hubs,
        status,
        description,
        updated_at
    `;

    values.push(id);

    const result = await this.framework.executeQuery(sql, values);

    if (!result.success) {
      throw new Error(`Failed to update project: ${result.error}`);
    }

    if (!result.rows?.[0]) {
      throw new Error('Project not found or no data returned');
    }

    const project = result.rows[0];
    return {
      ...project,
      hubspot_hubs: this.parseHubSpotHubs(project.hubspot_hubs)
    };
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    const sql = 'DELETE FROM projects WHERE id = $1';
    
    const result = await this.framework.executeQuery(sql, [id]);
    
    if (!result.success) {
      throw new Error(`Failed to delete project: ${result.error}`);
    }

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    const sql = `
      SELECT 
        id,
        name,
        customer,
        created_date,
        project_start_date,
        project_owner,
        hubspot_hubs,
        status,
        description,
        updated_at
      FROM projects 
      WHERE status = $1
      ORDER BY created_date DESC
    `;

    const result = await this.framework.executeQuery(sql, [status]);
    
    if (!result.success) {
      throw new Error(`Failed to fetch projects by status: ${result.error}`);
    }

    const projects = (result.rows || []).map(row => ({
      ...row,
      hubspot_hubs: this.parseHubSpotHubs(row.hubspot_hubs)
    }));

    return projects;
  }

  /**
   * Get projects by customer
   */
  async getProjectsByCustomer(customer: string): Promise<Project[]> {
    const sql = `
      SELECT 
        id,
        name,
        customer,
        created_date,
        project_start_date,
        project_owner,
        hubspot_hubs,
        status,
        description,
        updated_at
      FROM projects 
      WHERE customer ILIKE $1
      ORDER BY created_date DESC
    `;

    const result = await this.framework.executeQuery(sql, [`%${customer}%`]);
    
    if (!result.success) {
      throw new Error(`Failed to fetch projects by customer: ${result.error}`);
    }

    const projects = (result.rows || []).map(row => ({
      ...row,
      hubspot_hubs: this.parseHubSpotHubs(row.hubspot_hubs)
    }));

    return projects;
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<{
    total: number;
    byStatus: Record<ProjectStatus, number>;
    byHub: Record<HubSpotHub, number>;
  }> {
    const totalSql = 'SELECT COUNT(*) as total FROM projects';
    const statusSql = `
      SELECT status, COUNT(*) as count 
      FROM projects 
      GROUP BY status
    `;
    const hubSql = `
      SELECT hub, COUNT(*) as count
      FROM projects, UNNEST(hubspot_hubs) as hub
      GROUP BY hub
    `;

    const [totalResult, statusResult, hubResult] = await Promise.all([
      this.framework.executeQuery(totalSql),
      this.framework.executeQuery(statusSql),
      this.framework.executeQuery(hubSql)
    ]);

    if (!totalResult.success || !statusResult.success || !hubResult.success) {
      throw new Error('Failed to fetch project statistics');
    }

    const total = parseInt(totalResult.rows?.[0]?.total || '0');
    
    const byStatus = {} as Record<ProjectStatus, number>;
    statusResult.rows?.forEach(row => {
      byStatus[row.status as ProjectStatus] = parseInt(row.count);
    });

    const byHub = {} as Record<HubSpotHub, number>;
    hubResult.rows?.forEach(row => {
      byHub[row.hub as HubSpotHub] = parseInt(row.count);
    });

    return { total, byStatus, byHub };
  }

  /**
   * Parse HubSpot hubs array from PostgreSQL
   * PostgreSQL returns arrays in different formats, so we need to normalize them
   */
  private parseHubSpotHubs(hubs: any): HubSpotHub[] {
    if (!hubs) return [];
    
    // If it's already an array, return it
    if (Array.isArray(hubs)) {
      return hubs.filter(hub => typeof hub === 'string') as HubSpotHub[];
    }
    
    // If it's a string representation of an array (PostgreSQL format)
    if (typeof hubs === 'string') {
      try {
        // Handle PostgreSQL array format like {marketing_hub,sales_hub}
        if (hubs.startsWith('{') && hubs.endsWith('}')) {
          const content = hubs.slice(1, -1); // Remove { and }
          if (content.trim() === '') return [];
          return content.split(',').map(hub => hub.trim()) as HubSpotHub[];
        }
        
        // Try to parse as JSON array
        const parsed = JSON.parse(hubs);
        if (Array.isArray(parsed)) {
          return parsed.filter(hub => typeof hub === 'string') as HubSpotHub[];
        }
      } catch (error) {
        console.warn('Failed to parse hubspot_hubs:', hubs, error);
      }
    }
    
    return [];
  }
} 