import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch active training videos for retailers and employees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow access to retailers and employees
    if (!session || (session.user.role !== UserRole.RETAILER && session.user.role !== UserRole.EMPLOYEE && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('training_videos')
      .select(`
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        category,
        level,
        duration_minutes,
        is_active,
        view_count,
        created_at,
        created_by_user:users!training_videos_created_by_fkey(name)
      `)
      .eq('is_active', true) // Only show active videos
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (level && level !== 'ALL') {
      query = query.eq('level', level);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: videos, error } = await query;

    if (error) {
      console.error('Error fetching training videos:', error);
      return NextResponse.json({ error: 'Failed to fetch training videos' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('training_videos')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (category && category !== 'ALL') {
      countQuery = countQuery.eq('category', category);
    }

    if (level && level !== 'ALL') {
      countQuery = countQuery.eq('level', level);
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({ 
      success: true, 
      videos: videos || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in training videos GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Track video view (for analytics)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.RETAILER && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { video_id } = body;

    if (!video_id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Increment view count
    const { error } = await supabaseAdmin
      .from('training_videos')
      .update({ 
        view_count: supabaseAdmin.sql`view_count + 1` 
      })
      .eq('id', video_id)
      .eq('is_active', true);

    if (error) {
      console.error('Error updating view count:', error);
      return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'View count updated' 
    });

  } catch (error) {
    console.error('Error in training videos POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
