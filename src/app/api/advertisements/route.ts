import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch active advertisements (public access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    let query = supabaseAdmin
      .from('advertisements')
      .select(`
        id,
        title,
        description,
        image_url,
        link_url,
        position,
        is_active,
        start_date,
        end_date,
        click_count
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (position) {
      query = query.eq('position', position);
    }

    const { data: advertisements, error } = await query;

    if (error) {
      console.error('Error fetching advertisements:', error);
      return NextResponse.json({ error: 'Failed to fetch advertisements' }, { status: 500 });
    }

    // Filter advertisements by date range
    const now = new Date();
    const activeAds = advertisements?.filter(ad => {
      const startDate = new Date(ad.start_date);
      const endDate = ad.end_date ? new Date(ad.end_date) : null;
      
      return now >= startDate && (!endDate || now <= endDate);
    }) || [];

    return NextResponse.json({ 
      success: true, 
      advertisements: activeAds
    });

  } catch (error) {
    console.error('Error in advertisements GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Track advertisement click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ad_id } = body;

    if (!ad_id) {
      return NextResponse.json({ error: 'Advertisement ID is required' }, { status: 400 });
    }

    // Increment click count
    const { error } = await supabaseAdmin
      .from('advertisements')
      .update({ 
        click_count: supabaseAdmin.sql`click_count + 1` 
      })
      .eq('id', ad_id)
      .eq('is_active', true);

    if (error) {
      console.error('Error updating click count:', error);
      return NextResponse.json({ error: 'Failed to update click count' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Click count updated' 
    });

  } catch (error) {
    console.error('Error in advertisements POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
