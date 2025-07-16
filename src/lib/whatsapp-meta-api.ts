import axios from 'axios';

// Meta WhatsApp Cloud API Configuration
const META_API_BASE_URL = 'https://graph.facebook.com/v19.0';
const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
const TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'new_scheme_notification';
const TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';

interface WhatsAppTemplateMessage {
  to: string;
  recipientName: string;
  schemeTitle: string;
  schemeDescription: string;
}

interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

/**
 * Format phone number for WhatsApp API
 * Ensures proper international format without + symbol
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 91, it's already in correct format
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  }
  
  // If it's a 10-digit Indian number, add country code
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  // If it starts with 0, remove it and add country code
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `91${cleaned.substring(1)}`;
  }
  
  return cleaned;
}

/**
 * Send WhatsApp template message using Meta Cloud API
 */
export async function sendWhatsAppTemplate(message: WhatsAppTemplateMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      throw new Error('Meta WhatsApp API credentials not configured');
    }

    const formattedNumber = formatWhatsAppNumber(message.to);
    
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'template',
      template: {
        name: TEMPLATE_NAME,
        language: {
          code: TEMPLATE_LANGUAGE
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: message.recipientName
              },
              {
                type: 'text',
                text: message.schemeTitle
              },
              {
                type: 'text',
                text: message.schemeDescription
              }
            ]
          }
        ]
      }
    };

    console.log('📱 Sending WhatsApp template message:', {
      to: formattedNumber,
      template: TEMPLATE_NAME,
      recipient: message.recipientName
    });

    const response = await axios.post<WhatsAppApiResponse>(
      `${META_API_BASE_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const messageId = response.data.messages?.[0]?.id;
    
    console.log('✅ WhatsApp message sent successfully:', {
      messageId,
      to: formattedNumber
    });

    return {
      success: true,
      messageId
    };

  } catch (error: any) {
    console.error('❌ WhatsApp API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Send WhatsApp notifications to multiple recipients
 */
export async function sendBulkWhatsAppNotifications(
  recipients: Array<{
    phone: string;
    name: string;
    id: string;
  }>,
  schemeTitle: string,
  schemeDescription: string
): Promise<{
  successful: number;
  failed: number;
  results: Array<{
    recipientId: string;
    phone: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}> {
  const results = [];
  let successful = 0;
  let failed = 0;

  console.log(`📱 Starting bulk WhatsApp notifications for ${recipients.length} recipients`);

  for (const recipient of recipients) {
    try {
      const result = await sendWhatsAppTemplate({
        to: recipient.phone,
        recipientName: recipient.name,
        schemeTitle,
        schemeDescription
      });

      results.push({
        recipientId: recipient.id,
        phone: recipient.phone,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Add delay between messages to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`❌ Failed to send WhatsApp to ${recipient.phone}:`, error.message);
      
      results.push({
        recipientId: recipient.id,
        phone: recipient.phone,
        success: false,
        error: error.message
      });
      
      failed++;
    }
  }

  console.log(`📊 Bulk WhatsApp notifications completed: ${successful} successful, ${failed} failed`);

  return {
    successful,
    failed,
    results
  };
}

/**
 * Verify webhook signature (for production security)
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto');
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;
  
  if (!appSecret) {
    console.warn('⚠️ META_WHATSAPP_APP_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

// Legacy compatibility functions
export async function sendWhatsAppMessage(message: {
  phone: string;
  message: string;
  recipientType: 'EMPLOYEE' | 'RETAILER';
  recipientId?: string;
  schemeId?: string;
}): Promise<boolean> {
  try {
    const result = await sendWhatsAppTemplate({
      to: message.phone,
      templateName: 'general_notification',
      templateParams: [message.message],
      recipientType: message.recipientType,
      recipientId: message.recipientId,
      schemeId: message.schemeId,
    });
    return result.success;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

export async function notifyUsersAboutNewScheme(
  schemeId: string,
  schemeName: string,
  schemeDescription: string
): Promise<{ success: boolean; notificationsSent: number }> {
  try {
    // This would fetch users from database and send notifications
    // For now, return a mock response
    return {
      success: true,
      notificationsSent: 0
    };
  } catch (error) {
    console.error('Error notifying users about new scheme:', error);
    return {
      success: false,
      notificationsSent: 0
    };
  }
}

export async function getSchemeNotificationLogs(schemeId: string): Promise<any[]> {
  try {
    // This would fetch notification logs from database
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error getting scheme notification logs:', error);
    return [];
  }
}
