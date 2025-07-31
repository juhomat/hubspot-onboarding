import { NextRequest, NextResponse } from 'next/server';
import { createFramework } from '@/lib/config/database';
import { ProjectService, CreateProjectRequest } from '@/lib/services/ProjectService';

/**
 * GET /api/projects - Get all projects
 */
export async function GET() {
  try {
    const framework = await createFramework();
    const projectService = new ProjectService(framework);
    
    const projects = await projectService.getAllProjects();
    
    // Debug: Log the first project to see the data structure
    if (projects.length > 0) {
      console.log('Sample project data:', JSON.stringify(projects[0], null, 2));
    }
    
    await framework.dispose();
    
    return NextResponse.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch projects' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects - Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.customer || !body.project_owner) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, customer, project_owner' 
        },
        { status: 400 }
      );
    }

    const framework = await createFramework();
    const projectService = new ProjectService(framework);
    
    const projectData: CreateProjectRequest = {
      name: body.name,
      customer: body.customer,
      project_owner: body.project_owner,
      project_start_date: body.project_start_date,
      hubspot_hubs: body.hubspot_hubs || [],
      description: body.description
    };
    
    const newProject = await projectService.createProject(projectData);
    
    await framework.dispose();
    
    return NextResponse.json({
      success: true,
      data: newProject
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create project' 
      },
      { status: 500 }
    );
  }
} 