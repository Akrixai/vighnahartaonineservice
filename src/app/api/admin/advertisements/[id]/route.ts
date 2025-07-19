import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// PUT - Update advertisement (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const adId = resolvedParams.id;

    // Check if advertisement exists
    const { data: existingAd, error: fetchError } = await supabaseAdmin
      .from('advertisements')
      .select('id')
      .eq('id', adId)
      .single();

    if (fetchError || !existingAd) {
      return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    }

    // Validation
    if (body.image_url) {
      try {
        new URL(body.image_url);
      } catch {
        return NextResponse.json({ 
          error: 'Invalid image URL format' 
        }, { status: 400 });
      }
    }

    if (body.link_url) {
      try {
        new URL(body.link_url);
      } catch {
        return NextResponse.json({ 
          error: 'Invalid link URL format' 
        }, { status: 400 });
      }
    }

    if (body.position) {
      const validPositions = ['header', 'dashboard', 'sidebar', 'footer', 'popup'];
      if (!validPositions.includes(body.position)) {
        return NextResponse.json({
          error: 'Invalid position. Must be one of: header, dashboard, sidebar, footer, popup'
        }, { status: 400 });
      }
    }

    // Validate dates if provided
    if (body.start_date) {
      const startDate = new Date(body.start_date);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid start date' 
        }, { status: 400 });
      }
      body.start_date = startDate.toISOString();
    }

    if (body.end_date) {
      const endDate = new Date(body.end_date);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid end date' 
        }, { status: 400 });
      }
      body.end_date = endDate.toISOString();
    }

    // Check if end date is after start date
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);
      if (endDate <= startDate) {
        return NextResponse.json({ 
          error: 'End date must be after start date' 
        }, { status: 400 });
      }
    }

    const { data: advertisement, error } = await supabaseAdmin
      .from('advertisements')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', adId)
      .select()
      .single();

    if (error) {
      console.error('Error updating advertisement:', error);
      return NextResponse.json({ error: 'Failed to update advertisement' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Advertisement updated successfully',
      advertisement 
    });

  } catch (error) {
    console.error('Error in advertisement PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete advertisement (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const adId = resolvedParams.id;

    // Check if advertisement exists
    const { data: existingAd, error: fetchError } = await supabaseAdmin
      .from('advertisements')
      .select('id, title')
      .eq('id', adId)
      .single();

    if (fetchError || !existingAd) {
      return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('advertisements')
      .delete()
      .eq('id', adId);

    if (error) {
      console.error('Error deleting advertisement:', error);
      return NextResponse.json({ error: 'Failed to delete advertisement' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Advertisement deleted successfully' 
    });

  } catch (error) {
    console.error('Error in advertisement DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
