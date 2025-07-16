import { NextRequest, NextResponse } from 'next/server';
import { notifyUsersAboutNewScheme } from '@/lib/whatsapp-meta-api';
import { sendNewServiceNotifications, sendTestEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { type, testData } = await request.json();

    switch (type) {
      case 'whatsapp':
        console.log('🧪 Testing WhatsApp notifications...');
        await notifyUsersAboutNewScheme(
          'test-service-id',
          testData?.serviceName || 'Test Service',
          testData?.description || 'This is a test service for notification testing'
        );
        return NextResponse.json({ 
          success: true, 
          message: 'WhatsApp notifications sent successfully' 
        });

      case 'email':
        console.log('🧪 Testing Email notifications...');
        await sendNewServiceNotifications(
          'test-service-id',
          testData?.serviceName || 'Test Service',
          testData?.description || 'This is a test service for email notification testing'
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Email notifications sent successfully' 
        });

      case 'test-email':
        console.log('🧪 Testing single email...');
        const result = await sendTestEmail(testData?.email || 'test@example.com');
        return NextResponse.json({ 
          success: result, 
          message: result ? 'Test email sent successfully' : 'Failed to send test email' 
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid test type. Use: whatsapp, email, or test-email' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
