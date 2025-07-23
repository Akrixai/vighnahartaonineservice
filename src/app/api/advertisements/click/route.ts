import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Advertisement ID is required' }, { status: 400 });
    }

    // Increment click count
    const { error } = await supabaseAdmin
      .from('advertisements')
      .update({
        click_count: supabaseAdmin.raw('click_count + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating click count:', error);
      }
      return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracking advertisement click:', error);
    }
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
