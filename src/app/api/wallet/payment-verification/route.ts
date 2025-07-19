import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const amount = parseFloat(formData.get('amount') as string);
    const paymentMethod = formData.get('payment_method') as string;
    const transactionId = formData.get('transaction_id') as string;
    const type = formData.get('type') as string;
    const screenshot = formData.get('screenshot') as File;

    // Validate required fields
    if (!amount || !paymentMethod || !transactionId || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    if (amount < 1 || amount > 50000) {
      return NextResponse.json({ 
        error: 'Amount must be between ₹1 and ₹50,000' 
      }, { status: 400 });
    }

    let screenshotUrl = null;

    // Upload screenshot if provided
    if (screenshot && screenshot.size > 0) {
      try {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = screenshot.name.split('.').pop();
        const fileName = `payment-${timestamp}-${randomString}.${fileExtension}`;
        const filePath = `payment-screenshots/${fileName}`;

        // Convert file to buffer
        const bytes = await screenshot.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
          .from('documents')
          .upload(filePath, buffer, {
            contentType: screenshot.type,
            upsert: false
          });

        if (error) {
          console.error('Screenshot upload error:', error);
        } else {
          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('documents')
            .getPublicUrl(filePath);
          
          screenshotUrl = urlData?.publicUrl;
        }
      } catch (uploadError) {
        console.error('Error uploading screenshot:', uploadError);
        // Continue without screenshot if upload fails
      }
    }

    // Create payment verification record
    const verificationData = {
      user_id: session.user.id,
      amount: amount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      type: type,
      screenshot_url: screenshotUrl,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create wallet request for approval instead of payment verification
    const { data: walletRequest, error: requestError } = await supabaseAdmin
      .from('wallet_requests')
      .insert({
        user_id: session.user.id,
        type: 'TOPUP',
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        transaction_reference: transactionId,
        screenshot_url: screenshotUrl,
        description: `Wallet top-up via ${paymentMethod}`,
        metadata: {
          original_type: type || 'WALLET_TOPUP',
          payment_details: {
            method: paymentMethod,
            reference: transactionId
          }
        },
        status: 'PENDING'
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating wallet request:', requestError);
      return NextResponse.json({
        error: 'Failed to create wallet request'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet top-up request submitted successfully. Waiting for admin approval.',
      request_id: walletRequest.id
    });

  } catch (error) {
    console.error('Error in payment verification:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
