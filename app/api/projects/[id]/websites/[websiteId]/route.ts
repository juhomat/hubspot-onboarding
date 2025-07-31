import { NextRequest, NextResponse } from 'next/server';
import { createFramework } from '@/lib/config/database';
import { WebsiteService } from '@/lib/services/WebsiteService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; websiteId: string }> }
) {
  try {
    const resolvedParams = await params;
    const websiteId = resolvedParams.websiteId;
    
    const framework = await createFramework();
    const websiteService = new WebsiteService(framework);
    
    const website = await websiteService.getWebsiteById(websiteId);
    
    await framework.dispose();
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(website);
  } catch (error) {
    console.error('Error fetching website:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; websiteId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const websiteId = resolvedParams.websiteId;
    const body = await request.json();
    
    const framework = await createFramework();
    const websiteService = new WebsiteService(framework);
    
    // Validate URL format if URL is being updated
    if (body.url && !await websiteService.validateWebsiteUrl(body.url)) {
      await framework.dispose();
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Check for duplicate URLs if URL is being updated
    if (body.url && await websiteService.checkDuplicateUrl(projectId, body.url, websiteId)) {
      await framework.dispose();
      return NextResponse.json(
        { error: 'Website URL already exists for this project' },
        { status: 409 }
      );
    }
    
    const updateData = {
      url: body.url,
      name: body.name,
      description: body.description,
      status: body.status
    };
    
    const website = await websiteService.updateWebsite(websiteId, updateData);
    
    await framework.dispose();
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(website);
  } catch (error) {
    console.error('Error updating website:', error);
    return NextResponse.json(
      { error: 'Failed to update website' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; websiteId: string }> }
) {
  try {
    const resolvedParams = await params;
    const websiteId = resolvedParams.websiteId;
    
    const framework = await createFramework();
    const websiteService = new WebsiteService(framework);
    
    const success = await websiteService.deleteWebsite(websiteId);
    
    await framework.dispose();
    
    if (!success) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting website:', error);
    return NextResponse.json(
      { error: 'Failed to delete website' },
      { status: 500 }
    );
  }
} 