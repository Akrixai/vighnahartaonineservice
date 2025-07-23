import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Log all query parameters for debugging
  console.log('🔍 Webhook test - Query parameters:', {
    mode: searchParams.get('hub.mode'),
    verify_token: searchParams.get('hub.verify_token'),
    challenge: searchParams.get('hub.challenge'),
    all_params: Object.fromEntries(searchParams.entries())
  });

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  const expectedToken = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  
  console.log('🔑 Token comparison:', {
    received: token,
    expected: expectedToken,
    match: token === expectedToken
  });

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ Test webhook verification successful!');
    return new NextResponse(challenge, { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  console.log('❌ Test webhook verification failed');
  return NextResponse.json({ 
    error: 'Verification failed',
    received: { mode, token },
    expected: { mode: 'subscribe', token: expectedToken }
  }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    if (process.env.NODE_ENV === 'development') {
      console.log('📨 Test webhook POST received:', body);
    }

    return NextResponse.json({
      status: 'received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Test webhook POST error:', error);
    }
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
