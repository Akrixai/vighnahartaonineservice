import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/applications/[id]/approve - Approve application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = params.id;
    const body = await request.json();
    const { notes } = body;

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Application is not in pending status' },
        { status: 400 }
      );
    }

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'APPROVED',
        approved_by: session.user.id,
        processed_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', applicationId)
      .select(`
        id,
        form_data,
        documents,
        status,
        amount,
        notes,
        created_at,
        updated_at,
        schemes (
          id,
          name,
          description,
          price,
          category
        ),
        users (
          id,
          name,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
    }

    // Handle commission payment if applicable
    if (!application.commission_paid) {
      try {
        // Get scheme details
        const { data: scheme } = await supabaseAdmin
          .from('schemes')
          .select('commission_rate')
          .eq('id', application.scheme_id)
          .single();

        // Get user wallet
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('id, balance')
          .eq('user_id', application.user_id)
          .single();

        const commissionRate = scheme?.commission_rate || 0;
        const applicationAmount = parseFloat(application.amount?.toString() || '0');
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
              user_id: application.user_id,
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

          console.log(`Commission paid: ₹${commissionAmount} to user ${application.user_id}`);
        }
      } catch (walletError) {
        console.error('Error processing commission payment:', walletError);
        // Don't fail the approval, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      data: updatedApplication
    });

  } catch (error) {
    console.error('Approve application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications/[id]/reject - Reject application
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = params.id;
    const body = await request.json();
    const { notes, refund = false } = body;

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        users (
          id,
          wallets (
            id,
            balance
          )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Application is not in pending status' },
        { status: 400 }
      );
    }

    // Process refund if requested and application had payment
    if (refund && application.amount && application.amount > 0) {
      const wallet = application.users.wallets[0];
      if (wallet) {
        const currentBalance = parseFloat(wallet.balance.toString());
        const refundAmount = parseFloat(application.amount.toString());
        const newBalance = currentBalance + refundAmount;

        // Update wallet balance
        const { error: walletError } = await supabaseAdmin
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', wallet.id);

        if (walletError) {
          console.error('Error processing refund:', walletError);
          return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
        }

        // Create refund transaction
        const { error: transactionError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: application.user_id,
            wallet_id: wallet.id,
            type: 'REFUND',
            amount: refundAmount,
            status: 'COMPLETED',
            description: `Refund for rejected application: ${applicationId}`,
            reference: `refund_${applicationId}`
          });

        if (transactionError) {
          console.error('Error creating refund transaction:', transactionError);
          // Don't fail the rejection, just log the error
        }
      }
    }

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'REJECTED',
        rejected_by: session.user.id,
        processed_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', applicationId)
      .select(`
        id,
        form_data,
        documents,
        status,
        amount,
        notes,
        created_at,
        updated_at,
        schemes (
          id,
          name,
          description,
          price,
          category
        ),
        users (
          id,
          name,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Application rejected successfully${refund ? ' with refund' : ''}`,
      data: updatedApplication
    });

  } catch (error) {
    console.error('Reject application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
