import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Track free service usage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_id, service_name, external_url } = await request.json();

    if (!service_id || !service_name || !external_url) {
      return NextResponse.json({
        error: 'Service ID, name, and external URL are required'
      }, { status: 400 });
    }

    // Get user agent and IP address
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.ip || '127.0.0.1';

    // Track the usage
    const { error: trackingError } = await supabaseAdmin
      .from('free_service_usage')
      .insert({
        service_id,
        user_id: session.user.id,
        service_name,
        external_url,
        user_agent: userAgent,
        ip_address: ipAddress,
        accessed_at: new Date().toISOString()
      });

    if (trackingError) {
      console.error('Error tracking free service usage:', trackingError);
      // Don't fail the request if tracking fails
    }

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/free-services/track-usage:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
