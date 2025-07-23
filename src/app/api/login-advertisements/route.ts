import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get active advertisements for login page
    const { data: advertisements, error } = await supabaseAdmin
      .from('login_advertisements')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch advertisements' }, { status: 500 });
    }

    return NextResponse.json({ advertisements: advertisements || [] });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, image_url, link_url, display_order } = await request.json();

    if (!title || !image_url) {
      return NextResponse.json({ 
        error: 'Title and image URL are required' 
      }, { status: 400 });
    }

    const { data: advertisement, error } = await supabaseAdmin
      .from('login_advertisements')
      .insert({
        title,
        description,
        image_url,
        link_url,
        display_order: display_order || 0,
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
      advertisement 
    });

  } catch (error) {
    console.error('Create advertisement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, description, image_url, link_url, display_order, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Advertisement ID is required' }, { status: 400 });
    }

    const { data: advertisement, error } = await supabaseAdmin
      .from('login_advertisements')
      .update({
        title,
        description,
        image_url,
        link_url,
        display_order,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating advertisement:', error);
      return NextResponse.json({ error: 'Failed to update advertisement' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      advertisement 
    });

  } catch (error) {
    console.error('Update advertisement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Advertisement ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('login_advertisements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting advertisement:', error);
      return NextResponse.json({ error: 'Failed to delete advertisement' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete advertisement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
