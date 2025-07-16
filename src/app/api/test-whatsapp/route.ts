import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendWhatsAppTemplate } from '@/lib/whatsapp-meta-api';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber, recipientName, testMessage } = await request.json();

    if (!phoneNumber || !recipientName) {
      return NextResponse.json({ 
        error: 'Phone number and recipient name are required' 
      }, { status: 400 });
    }

    console.log('🧪 Testing WhatsApp API with:', { phoneNumber, recipientName });

    const result = await sendWhatsAppTemplate({
      to: phoneNumber,
      recipientName: recipientName,
      schemeTitle: 'Test Service',
      schemeDescription: testMessage || 'This is a test message from Vignaharta Janseva portal.'
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Test WhatsApp API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
