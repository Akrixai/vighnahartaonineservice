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
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !existingApp) {
      console.error('Application fetch error:', fetchError);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
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

    // If approved, handle commission payment
    if (status === 'APPROVED' && existingApp.status === 'PENDING' && !existingApp.commission_paid) {
      try {
        // Get scheme details
        const { data: scheme } = await supabaseAdmin
          .from('schemes')
          .select('commission_rate')
          .eq('id', existingApp.scheme_id)
          .single();

        // Get user wallet
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('id, balance')
          .eq('user_id', existingApp.user_id)
          .single();

        const commissionRate = scheme?.commission_rate || 0;
        const applicationAmount = parseFloat(existingApp.amount?.toString() || '0');
        const commissionAmount = (applicationAmount * commissionRate) / 100;

        if (commissionAmount > 0 && wallet) {
          const currentBalance = parseFloat(wallet.balance.toString());
          const newBalance = currentBalance + commissionAmount;

          // Update wallet balance
          await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', wallet.id);

          // Create commission transaction
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: existingApp.user_id,
              wallet_id: wallet.id,
              type: 'COMMISSION',
              amount: commissionAmount,
              status: 'COMPLETED',
              description: `Commission for approved application #${applicationId}`,
              reference: `COMM_${applicationId}`,
              metadata: {
                application_id: applicationId,
                commission_rate: commissionRate,
                original_amount: applicationAmount
              },
              processed_by: session.user.id,
              processed_at: new Date().toISOString()
            });

          // Mark commission as paid in application
          await supabaseAdmin
            .from('applications')
            .update({
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              commission_paid: true,
              commission_paid_at: new Date().toISOString()
            })
            .eq('id', applicationId);

          console.log(`Commission paid: ₹${commissionAmount} to user ${existingApp.user_id}`);
        }
      } catch (walletError) {
        console.error('Error processing commission payment:', walletError);
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

    // Admin can delete any application - removed restriction
    // Log the deletion for audit purposes
    console.log(`Admin ${session.user.id} deleting application ${applicationId} with status ${existingApp.status}`);

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
