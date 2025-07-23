import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .or(`target_roles.cs.{${session.user.role}},target_users.cs.{${session.user.id}}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      message,
      type,
      data,
      target_roles,
      target_users
    } = body;

    if (!title || !message || !type) {
      return NextResponse.json({
        error: 'Title, message, and type are required'
      }, { status: 400 });
    }

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        title,
        message,
        type,
        data: data || {},
        target_roles: target_roles || [],
        target_users: target_users || [],
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    let query = supabaseAdmin
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() });

    if (mark_all_read) {
      // Mark all notifications for this user as read
      query = query.or(`target_roles.cs.{${session.user.role}},target_users.cs.{${session.user.id}}`);
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      query = query.in('id', notification_ids);
    } else {
      return NextResponse.json({
        error: 'Either notification_ids or mark_all_read must be provided'
      }, { status: 400 });
    }

    const { error } = await query;

    if (error) {
      console.error('Error updating notifications:', error);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete all notifications for user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and EMPLOYEE to delete notifications
    if (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .or(`target_roles.cs.{${session.user.role}},target_users.cs.{${session.user.id}}`);

    if (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications deleted'
    });

  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
