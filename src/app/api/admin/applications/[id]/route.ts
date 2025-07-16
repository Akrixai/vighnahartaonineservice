import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// PUT - Update application status (Admin and Employee)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;
    const { status, notes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if application exists
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, user_id, scheme_id, amount')
      .eq('id', applicationId)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      updated_at: string;
      status?: string;
      admin_notes?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      updateData.processed_at = new Date().toISOString();
      
      if (status === 'APPROVED') {
        updateData.approved_by = session.user.id;
      } else if (status === 'REJECTED') {
        updateData.rejected_by = session.user.id;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select(`
        *,
        user:users!applications_user_id_fkey(id, name, email),
        scheme:schemes!applications_scheme_id_fkey(id, name, price)
      `)
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // If approved, handle wallet transactions and commission
    if (status === 'APPROVED' && existingApp.status === 'PENDING') {
      try {
        // TODO: Implement wallet deduction and commission calculation
        // This would involve:
        // 1. Deducting amount from retailer's wallet
        // 2. Adding commission to retailer's wallet
        // 3. Creating transaction records
        console.log('Application approved - implement wallet transactions');
      } catch (walletError) {
        console.error('Error processing wallet transactions:', walletError);
        // Don't fail the approval, but log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application updated successfully',
      application 
    });

  } catch (error) {
    console.error('Error in application PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete application (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    // Check if application exists
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, customer_name')
      .eq('id', applicationId)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Prevent deletion of approved applications (optional business rule)
    if (existingApp.status === 'APPROVED' || existingApp.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Cannot delete approved or completed applications' 
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application deleted successfully' 
    });

  } catch (error) {
    console.error('Error in application DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
