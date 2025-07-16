import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - Fetch all advertisements (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: advertisements, error } = await supabaseAdmin
      .from('advertisements')
      .select(`
        *,
        created_by_user:users!advertisements_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching advertisements:', error);
      return NextResponse.json({ error: 'Failed to fetch advertisements' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      advertisements: advertisements || [] 
    });

  } catch (error) {
    console.error('Error in advertisements GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new advertisement (Admin only)
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
      image_url,
      link_url,
      position,
      start_date,
      end_date
    } = body;

    // Validation
    if (!title || !image_url || !position || !start_date) {
      return NextResponse.json({ 
        error: 'Title, image URL, position, and start date are required' 
      }, { status: 400 });
    }

    // Validate image URL format (basic check)
    try {
      new URL(image_url);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid image URL format' 
      }, { status: 400 });
    }

    // Validate link URL if provided
    if (link_url) {
      try {
        new URL(link_url);
      } catch {
        return NextResponse.json({ 
          error: 'Invalid link URL format' 
        }, { status: 400 });
      }
    }

    // Validate position
    const validPositions = ['header', 'dashboard', 'sidebar', 'footer', 'popup'];
    if (!validPositions.includes(position)) {
      return NextResponse.json({ 
        error: 'Invalid position. Must be one of: header, sidebar, footer, popup' 
      }, { status: 400 });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = end_date ? new Date(end_date) : null;
    
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid start date' 
      }, { status: 400 });
    }

    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid end date' 
      }, { status: 400 });
    }

    if (endDate && endDate <= startDate) {
      return NextResponse.json({ 
        error: 'End date must be after start date' 
      }, { status: 400 });
    }

    const { data: advertisement, error } = await supabaseAdmin
      .from('advertisements')
      .insert({
        title,
        description,
        image_url,
        link_url,
        position,
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating advertisement:', error);
      return NextResponse.json({ error: 'Failed to create advertisement' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Advertisement created successfully',
      advertisement 
    });

  } catch (error) {
    console.error('Error in advertisements POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
