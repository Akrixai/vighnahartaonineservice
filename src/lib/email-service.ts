import nodemailer from 'nodemailer';
import { 
  getNewServiceEmailTemplate, 
  getWelcomeRetailerEmailTemplate, 
  getWelcomeEmployeeEmailTemplate,
  EmailTemplate 
} from './email-templates';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter (lazy initialization to avoid import issues)
let transporter: any = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch (error) {
    return false;
  }
}

// Send email function
export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  fromName: string = 'विघ्नहर्ता जनसेवा'
): Promise<boolean> {
  try {
    const recipients = Array.isArray(to) ? to : [to];
    
    const mailOptions = {
      from: `"${fromName}" <${emailConfig.auth.user}>`,
      to: recipients.join(', '),
      subject: template.subject,
      text: template.text,
      html: template.html
    };

    const info = await getTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
}

// Send new service notification emails
export async function sendNewServiceNotifications(
  serviceId: string,
  serviceName: string,
  serviceDescription: string
): Promise<void> {
  try {
    
    // Import supabase here to avoid circular dependencies
    const { supabaseAdmin } = await import('./supabase');
    
    // Get all active retailers and employees with email addresses
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .in('role', ['RETAILER', 'EMPLOYEE'])
      .eq('is_active', true)
      .not('email', 'is', null)
      .neq('email', '');

    if (error) {
      return;
    }

    if (!users || users.length === 0) {
      return;
    }

    // Send emails to all users
    const emailPromises = users.map(async (user) => {
      try {
        const template = getNewServiceEmailTemplate(
          serviceName,
          serviceDescription,
          user.name,
          user.role.toLowerCase() as 'retailer' | 'employee'
        );

        const success = await sendEmail(user.email, template);
        
        return success;
      } catch (error) {
        return false;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - successful;

  } catch (error) {
  }
}

// Send welcome email to new retailer
export async function sendWelcomeRetailerEmail(
  name: string,
  email: string,
  password: string
): Promise<boolean> {
  try {
    
    const template = getWelcomeRetailerEmailTemplate(name, email, password);
    const success = await sendEmail(email, template);
    
    return success;
  } catch (error) {
    return false;
  }
}

// Send welcome email to new employee
export async function sendWelcomeEmployeeEmail(
  name: string,
  email: string,
  password: string
): Promise<boolean> {
  try {
    
    const template = getWelcomeEmployeeEmailTemplate(name, email, password);
    const success = await sendEmail(email, template);
    
    return success;
  } catch (error) {
    return false;
  }
}

// Akrix branding footer for test emails
function getAkrixBrandingFooter(): string {
  return `
    <div style="background-color: #1f2937; padding: 20px; text-align: center; margin-top: 30px;">
      <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
        Powered by
      </p>
      <a href="https://akrix-ai.netlify.app" target="_blank" rel="noopener noreferrer"
         style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #ec4899, #8b5cf6);
                color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none;
                font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        🚀 Akrix.ai
      </a>
      <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
        Advanced AI Solutions for Modern Applications
      </p>
    </div>
  `;
}

// Test email function
export async function sendTestEmail(to: string): Promise<boolean> {
  try {
    const template = {
      subject: '🧪 Test Email from विघ्नहर्ता जनसेवा',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">🧪 Test Email</h1>
          <p>This is a test email from विघ्नहर्ता जनसेवा email service.</p>
          <p>If you received this email, the email configuration is working correctly!</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
          ${getAkrixBrandingFooter()}
        </div>
      `,
      text: `Test Email from विघ्नहर्ता जनसेवा\n\nThis is a test email. If you received this, the email service is working!\n\nSent at: ${new Date().toLocaleString()}\n\n---\nPowered by Akrix.ai\nVisit: https://akrix-ai.netlify.app\nAdvanced AI Solutions for Modern Applications`
    };

    return await sendEmail(to, template);
  } catch (error) {
    return false;
  }
}
