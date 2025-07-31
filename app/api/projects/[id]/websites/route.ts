import { NextRequest, NextResponse } from 'next/server';
import { createFramework } from '@/lib/config/database';
import { WebsiteService } from '@/lib/services/WebsiteService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    
    const framework = await createFramework();
    const websiteService = new WebsiteService(framework);
    
    const websites = await websiteService.getWebsitesByProject(projectId);
    
    await framework.dispose();
    
    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch websites' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const body = await request.json();
    
    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    const framework = await createFramework();
    const websiteService = new WebsiteService(framework);
    
    // Validate URL format
    if (!await websiteService.validateWebsiteUrl(body.url)) {
      await framework.dispose();
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Check for duplicate URLs in the project
    if (await websiteService.checkDuplicateUrl(projectId, body.url)) {
      await framework.dispose();
      return NextResponse.json(
        { error: 'Website URL already exists for this project' },
        { status: 409 }
      );
    }
    
    const websiteData = {
      project_id: projectId,
      url: body.url,
      name: body.name,
      description: body.description,
      status: body.status || 'active'
    };
    
    const website = await websiteService.createWebsite(websiteData);
    
    await framework.dispose();
    
    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    console.error('Error creating website:', error);
    return NextResponse.json(
      { error: 'Failed to create website' },
      { status: 500 }
    );
  }
} 