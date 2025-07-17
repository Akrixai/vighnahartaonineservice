import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT - Update branch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if branch exists
    const { data: existingBranch, error: fetchError } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingBranch) {
      return NextResponse.json({
        error: 'Branch not found'
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle different update scenarios
    if (body.hasOwnProperty('is_active')) {
      // Status toggle
      updateData.is_active = body.is_active;
    } else {
      // Full update
      const { name, code, address, phone, email, manager_name } = body;

      if (!name || !code) {
        return NextResponse.json({
          error: 'Branch name and code are required'
        }, { status: 400 });
      }

      // Check if branch code already exists (excluding current branch)
      const { data: codeCheck, error: codeError } = await supabaseAdmin
        .from('branches')
        .select('id')
        .eq('code', code.toUpperCase())
        .neq('id', id)
        .single();

      if (codeCheck && !codeError) {
        return NextResponse.json({
          error: 'Branch code already exists'
        }, { status: 400 });
      }

      updateData.name = name.trim();
      updateData.code = code.toUpperCase().trim();
      updateData.address = address?.trim() || null;
      updateData.phone = phone?.trim() || null;
      updateData.email = email?.trim() || null;
      updateData.manager_name = manager_name?.trim() || null;
    }

    // Update the branch
    const { data: updatedBranch, error: updateError } = await supabaseAdmin
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating branch:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update branch' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      branch: updatedBranch
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/branches/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if branch exists
    const { data: existingBranch, error: fetchError } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingBranch) {
      return NextResponse.json({
        error: 'Branch not found'
      }, { status: 404 });
    }

    // Check if branch is being used in employee certificates
    const { data: certificatesUsingBranch, error: certError } = await supabaseAdmin
      .from('employee_certificates')
      .select('id')
      .eq('branch', existingBranch.name)
      .limit(1);

    if (certificatesUsingBranch && certificatesUsingBranch.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete branch as it is being used in employee certificates'
      }, { status: 400 });
    }

    // Delete the branch
    const { error: deleteError } = await supabaseAdmin
      .from('branches')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting branch:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete branch' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/branches/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
