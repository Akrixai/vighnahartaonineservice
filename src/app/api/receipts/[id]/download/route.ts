import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: receiptId } = await params;

    // Fetch receipt with related data
    let query = supabaseAdmin
      .from('receipts')
      .select(`
        id,
        application_id,
        retailer_id,
        employee_id,
        receipt_number,
        service_name,
        service_fee,
        processing_fee,
        total_amount,
        approval_date,
        receipt_data,
        created_at,
        retailer:users!receipts_retailer_id_fkey (
          id,
          name,
          email,
          phone
        ),
        employee:users!receipts_employee_id_fkey (
          id,
          name,
          email
        ),
        application:applications!receipts_application_id_fkey (
          id,
          status,
          form_data,
          documents,
          customer_name,
          customer_email,
          customer_phone,
          customer_address
        )
      `)
      .eq('id', receiptId);

    // Filter based on user role
    if (session.user.role === UserRole.RETAILER) {
      query = query.eq('retailer_id', session.user.id);
    }

    const { data: receipt, error } = await query.single();

    if (error || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Generate receipt data for PDF
    const receiptData = {
      receiptNumber: receipt.receipt_number,
      approvalDate: receipt.approval_date,
      serviceName: receipt.service_name,
      serviceFee: parseFloat(receipt.service_fee) || 0,
      processingFee: parseFloat(receipt.processing_fee) || 0,
      totalAmount: parseFloat(receipt.total_amount) || 0,
      retailer: {
        name: receipt.retailer.name,
        email: receipt.retailer.email,
        phone: receipt.retailer.phone
      },
      employee: {
        name: receipt.employee.name,
        email: receipt.employee.email
      },
      application: {
        id: receipt.application.id,
        status: receipt.application.status,
        data: receipt.application.form_data,
        documents: receipt.application.documents,
        customer_name: receipt.application.customer_name,
        customer_email: receipt.application.customer_email,
        customer_phone: receipt.application.customer_phone,
        customer_address: receipt.application.customer_address
      },
      additionalData: receipt.receipt_data
    };

    return NextResponse.json({ 
      success: true, 
      receipt: receiptData 
    });

  } catch (error) {
    console.error('Receipt download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
