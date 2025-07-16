import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - Get all queries (Admin/Employee only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get queries
    const { data: queries, error: queriesError } = await supabaseAdmin
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (queriesError) {
      console.error('Error fetching queries:', queriesError);
      return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 });
    }

    if (!queries || queries.length === 0) {
      return NextResponse.json([]);
    }

    // Get unique user IDs
    const userIds = [...new Set(queries.map(query => query.user_id))];

    // Fetch users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    }

    // Create user lookup map
    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    // Format queries with user data
    const formattedQueries = queries.map(query => {
      const user = userMap.get(query.user_id);
      return {
        ...query,
        users: user
      };
    });

    return NextResponse.json(formattedQueries);

  } catch (error) {
    console.error('Error in queries GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PATCH - Update query status/response (Admin/Employee only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, response, responded_by, responded_at } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 });
    }

    const updateData: {
      updated_at: string;
      status?: string;
      admin_response?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    if (response) {
      updateData.response = response;
    }

    if (responded_by) {
      updateData.responded_by = responded_by;
    }

    if (responded_at) {
      updateData.responded_at = responded_at;
    }

    const { data: updatedQuery, error } = await supabaseAdmin
      .from('queries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating query:', error);
      return NextResponse.json({ error: 'Failed to update query' }, { status: 500 });
    }

    return NextResponse.json(updatedQuery);

  } catch (error) {
    console.error('Error in queries PATCH:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete query (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('queries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting query:', error);
      return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Query deleted successfully' });

  } catch (error) {
    console.error('Error in queries DELETE:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
