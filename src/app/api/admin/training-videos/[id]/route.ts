import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// PUT - Update training video (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const videoId = params.id;

    // Check if video exists
    const { data: existingVideo, error: fetchError } = await supabaseAdmin
      .from('training_videos')
      .select('id')
      .eq('id', videoId)
      .single();

    if (fetchError || !existingVideo) {
      return NextResponse.json({ error: 'Training video not found' }, { status: 404 });
    }

    // Validation
    if (body.video_url) {
      try {
        new URL(body.video_url);
      } catch {
        return NextResponse.json({ 
          error: 'Invalid video URL format' 
        }, { status: 400 });
      }
    }

    if (body.duration_minutes !== undefined && body.duration_minutes <= 0) {
      return NextResponse.json({ 
        error: 'Duration must be positive' 
      }, { status: 400 });
    }

    const { data: video, error } = await supabaseAdmin
      .from('training_videos')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)
      .select()
      .single();

    if (error) {
      console.error('Error updating training video:', error);
      return NextResponse.json({ error: 'Failed to update training video' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Training video updated successfully',
      video 
    });

  } catch (error) {
    console.error('Error in training video PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete training video (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoId = params.id;

    // Check if video exists
    const { data: existingVideo, error: fetchError } = await supabaseAdmin
      .from('training_videos')
      .select('id, title')
      .eq('id', videoId)
      .single();

    if (fetchError || !existingVideo) {
      return NextResponse.json({ error: 'Training video not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('training_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting training video:', error);
      return NextResponse.json({ error: 'Failed to delete training video' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Training video deleted successfully' 
    });

  } catch (error) {
    console.error('Error in training video DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
