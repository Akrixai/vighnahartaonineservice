import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch all training videos (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: videos, error } = await supabaseAdmin
      .from('training_videos')
      .select(`
        *,
        created_by_user:users!training_videos_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching training videos:', error);
      return NextResponse.json({ error: 'Failed to fetch training videos' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      videos: videos || [] 
    });

  } catch (error) {
    console.error('Error in training videos GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new training video (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      video_url,
      thumbnail_url,
      category,
      level,
      duration_minutes
    } = body;

    // Validation
    if (!title || !video_url) {
      return NextResponse.json({ 
        error: 'Title and video URL are required' 
      }, { status: 400 });
    }

    // Validate video URL format (basic check)
    try {
      new URL(video_url);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid video URL format' 
      }, { status: 400 });
    }

    if (duration_minutes && duration_minutes <= 0) {
      return NextResponse.json({ 
        error: 'Duration must be positive' 
      }, { status: 400 });
    }

    const { data: video, error } = await supabaseAdmin
      .from('training_videos')
      .insert({
        title,
        description,
        video_url,
        thumbnail_url,
        category,
        level: level || 'Beginner',
        duration_minutes,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating training video:', error);
      return NextResponse.json({ error: 'Failed to create training video' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Training video created successfully',
      video 
    });

  } catch (error) {
    console.error('Error in training videos POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
