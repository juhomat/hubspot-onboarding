import { NextRequest, NextResponse } from 'next/server';
import { createFramework } from '@/lib/config/database';
import { ProjectService, UpdateProjectRequest } from '@/lib/services/ProjectService';

/**
 * GET /api/projects/[id] - Get project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const framework = await createFramework();
    const projectService = new ProjectService(framework);
    
    const project = await projectService.getProjectById(resolvedParams.id);
    
    await framework.dispose();
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id] - Update project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    const framework = await createFramework();
    const projectService = new ProjectService(framework);
    
    const updates: UpdateProjectRequest = {};
    
    // Only include fields that are provided
    if (body.name !== undefined) updates.name = body.name;
    if (body.customer !== undefined) updates.customer = body.customer;
    if (body.project_owner !== undefined) updates.project_owner = body.project_owner;
    if (body.project_start_date !== undefined) updates.project_start_date = body.project_start_date;
    if (body.hubspot_hubs !== undefined) updates.hubspot_hubs = body.hubspot_hubs;
    if (body.status !== undefined) updates.status = body.status;
    if (body.description !== undefined) updates.description = body.description;
    
    const updatedProject = await projectService.updateProject(resolvedParams.id, updates);
    
    await framework.dispose();
    
    return NextResponse.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Failed to update project:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id] - Delete project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const framework = await createFramework();
    const projectService = new ProjectService(framework);
    
    const deleted = await projectService.deleteProject(resolvedParams.id);
    
    await framework.dispose();
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 