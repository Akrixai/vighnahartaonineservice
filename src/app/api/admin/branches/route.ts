import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch all branches
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: branches, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching branches:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch branches' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      branches: branches || []
    });

  } catch (error) {
    console.error('Error in GET /api/admin/branches:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Create new branch
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, code, address, phone, email, manager_name } = await request.json();

    // Validation
    if (!name || !code) {
      return NextResponse.json({
        error: 'Branch name and code are required'
      }, { status: 400 });
    }

    // Check if branch code already exists
    const { data: existingBranch, error: checkError } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existingBranch && !checkError) {
      return NextResponse.json({
        error: 'Branch code already exists'
      }, { status: 400 });
    }

    // Create branch
    const branchData = {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      address: address?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      manager_name: manager_name?.trim() || null,
      is_active: true,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: branch, error } = await supabaseAdmin
      .from('branches')
      .insert(branchData)
      .select()
      .single();

    if (error) {
      console.error('Error creating branch:', error);
      return NextResponse.json({ 
        error: 'Failed to create branch' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      branch
    });

  } catch (error) {
    console.error('Error in POST /api/admin/branches:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
