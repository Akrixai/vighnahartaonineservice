import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, consents, userAgent, timestamp } = body;

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Store consent in database
    const { data, error } = await supabase
      .from('user_consent')
      .insert({
        session_id: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        consent_given: true,
        consent_type: 'privacy_policy',
        consent_version: '1.0',
        consent_data: {
          privacy: consents.privacy,
          cookies: consents.cookies,
          dataProcessing: consents.dataProcessing,
          marketing: consents.marketing,
          timestamp: timestamp
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing consent:', error);
      return NextResponse.json(
        { error: 'Failed to store consent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      consentId: data.id 
    });

  } catch (error) {
    console.error('Error processing consent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_consent')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Consent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      consent: data 
    });

  } catch (error) {
    console.error('Error fetching consent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
