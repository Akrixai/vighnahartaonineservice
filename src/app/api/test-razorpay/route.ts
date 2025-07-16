import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    return NextResponse.json({
      success: true,
      data: {
        keyIdExists: !!razorpayKeyId,
        keySecretExists: !!razorpayKeySecret,
        keyIdLength: razorpayKeyId?.length || 0,
        keySecretLength: razorpayKeySecret?.length || 0,
        keyIdPrefix: razorpayKeyId?.substring(0, 8) || 'Not found',
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment variables'
    }, { status: 500 });
  }
}
