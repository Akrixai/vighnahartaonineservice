import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/applications/[id]/approve - Approve application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = id;
    const body = await request.json();
    const { notes } = body;

    // Get application details with user wallet information
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        users (
          id,
          name,
          email,
          wallets (
            id,
            balance
          )
        ),
        schemes (
          id,
          name,
          price,
          commission_rate
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

    // Check if user has a wallet
    const userWallet = application.users.wallets?.[0];
    if (!userWallet) {
      return NextResponse.json({
        error: 'User does not have a wallet. Cannot process payment.'
      }, { status: 400 });
    }

    // Get the service amount (for reapplications, amount should be 0, for regular applications use scheme price or application amount)
    const isReapplication = application.notes && application.notes.includes('REAPPLICATION');
    const serviceAmount = isReapplication ? 0 : parseFloat(application.schemes?.price?.toString() || application.amount?.toString() || '0');

    if (serviceAmount > 0) {
      // Check wallet balance
      const currentBalance = parseFloat(userWallet.balance.toString());

      if (currentBalance < serviceAmount) {
        return NextResponse.json({
          error: `Insufficient wallet balance. Required: ₹${serviceAmount}, Available: ₹${currentBalance}`
        }, { status: 400 });
      }
    }

    // Deduct service amount from wallet if applicable
    if (serviceAmount > 0) {
      const newBalance = parseFloat(userWallet.balance.toString()) - serviceAmount;

      // Update wallet balance
      const { error: walletUpdateError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userWallet.id);

      if (walletUpdateError) {
        console.error('Error updating wallet balance:', walletUpdateError);
        return NextResponse.json({
          error: 'Failed to deduct service amount from wallet'
        }, { status: 500 });
      }

      // Create debit transaction record
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: application.user_id,
          wallet_id: userWallet.id,
          type: 'SCHEME_PAYMENT',
          amount: serviceAmount,
          status: 'COMPLETED',
          description: `Payment for ${application.schemes?.name || 'service'} application`,
          reference: `APP_${applicationId}`,
          metadata: {
            application_id: applicationId,
            scheme_id: application.scheme_id,
            scheme_name: application.schemes?.name,
            approved_by: session.user.id
          },
          processed_by: session.user.id,
          processed_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        // Don't fail the approval, but log the error
      }
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
        const commissionRate = application.schemes?.commission_rate || 0;
        // For commission calculation, always use original scheme price (both for regular and reapplications)
        const schemePrice = parseFloat(application.schemes?.price?.toString() || '0');
        const commissionAmount = (schemePrice * commissionRate) / 100;

        console.log('Commission calculation:', {
          isReapplication,
          schemePrice,
          commissionRate,
          commissionAmount,
          serviceAmount
        });

        if (commissionAmount > 0 && userWallet) {
          // Get current balance after service deduction
          const { data: currentWallet } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('id', userWallet.id)
            .single();

          const currentBalance = parseFloat(currentWallet?.balance?.toString() || '0');
          const newBalance = currentBalance + commissionAmount;

          // Update wallet balance with commission
          await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', userWallet.id);

          // Create commission transaction
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: application.user_id,
              wallet_id: userWallet.id,
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

    // Get final wallet balance for response
    const { data: finalWallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', application.user_id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      data: updatedApplication,
      wallet_info: serviceAmount > 0 ? {
        amount_deducted: serviceAmount,
        remaining_balance: finalWallet?.balance || 0
      } : null
    });

  } catch (error) {
    console.error('Approve application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications/[id]/reject - Reject application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = id;
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
