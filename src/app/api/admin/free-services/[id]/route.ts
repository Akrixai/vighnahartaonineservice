import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT - Update free service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if service exists and is a free service
    const { data: existingService, error: fetchError } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('id', id)
      .eq('is_free', true)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json({
        error: 'Free service not found'
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle different update scenarios
    if (body.hasOwnProperty('is_active')) {
      // Status toggle
      updateData.is_active = body.is_active;
    } else {
      // Full update
      const { name, description, category, external_url } = body;

      if (!name || !description || !category || !external_url) {
        return NextResponse.json({
          error: 'Name, description, category, and external URL are required'
        }, { status: 400 });
      }

      // Validate URL format
      try {
        new URL(external_url);
      } catch {
        return NextResponse.json({
          error: 'Invalid URL format'
        }, { status: 400 });
      }

      updateData.name = name.trim();
      updateData.description = description.trim();
      updateData.category = category.trim();
      updateData.external_url = external_url.trim();
    }

    // Update the service
    const { data: updatedService, error: updateError } = await supabaseAdmin
      .from('schemes')
      .update(updateData)
      .eq('id', id)
      .eq('is_free', true)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating free service:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update free service' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      freeService: updatedService
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/free-services/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete free service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if service exists and is a free service
    const { data: existingService, error: fetchError } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('id', id)
      .eq('is_free', true)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json({
        error: 'Free service not found'
      }, { status: 404 });
    }

    // Delete the service
    const { error: deleteError } = await supabaseAdmin
      .from('schemes')
      .delete()
      .eq('id', id)
      .eq('is_free', true);

    if (deleteError) {
      console.error('Error deleting free service:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete free service' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Free service deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/free-services/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
