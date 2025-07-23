import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { notifyUsersAboutNewScheme, getSchemeNotificationLogs } from '@/lib/whatsapp-meta-api';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check for internal API call (from server-side)
    const isInternalCall = request.headers.get('x-internal-call') === 'true';

    if (!isInternalCall) {
      // For external calls, require admin authentication
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { schemeId, schemeTitle, schemeDescription } = await request.json();

    if (!schemeId) {
      return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
    }

    let scheme;

    // If scheme details are provided, use them directly
    if (schemeTitle && schemeDescription) {
      scheme = {
        id: schemeId,
        title: schemeTitle,
        description: schemeDescription
      };
    } else {
      // Otherwise, fetch from database
      const { data: fetchedScheme, error: schemeError } = await supabaseAdmin
        .from('schemes')
        .select('id, name, description')
        .eq('id', schemeId)
        .single();

      if (schemeError || !fetchedScheme) {
        return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
      }

      scheme = {
        id: fetchedScheme.id,
        title: fetchedScheme.name,
        description: fetchedScheme.description
      };
    }

    // Send WhatsApp notifications
    await notifyUsersAboutNewScheme(scheme.id, scheme.title, scheme.description);

    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp notifications sent successfully' 
    });

  } catch (error) {
    console.error('WhatsApp notification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schemeId = searchParams.get('schemeId');

    if (!schemeId) {
      return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
    }

    // Get notification logs for the scheme
    const logs = await getSchemeNotificationLogs(schemeId);

    return NextResponse.json({ logs });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('WhatsApp notification logs API error:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
