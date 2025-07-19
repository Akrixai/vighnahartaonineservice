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
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
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
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('📧 Recipients:', recipients.join(', '));
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
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
    console.log('📧 Sending new service notification emails...');
    
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
      console.error('❌ Error fetching users for email notifications:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('📧 No users found for email notifications');
      return;
    }

    console.log(`📧 Found ${users.length} users for email notifications`);

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
        
        if (success) {
          console.log(`✅ Email sent to ${user.name} (${user.email})`);
        } else {
          console.error(`❌ Failed to send email to ${user.name} (${user.email})`);
        }

        return success;
      } catch (error) {
        console.error(`❌ Error sending email to ${user.name}:`, error);
        return false;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - successful;

    console.log(`📧 Email notification summary: ${successful} sent, ${failed} failed`);

  } catch (error) {
    console.error('❌ Error in sendNewServiceNotifications:', error);
  }
}

// Send welcome email to new retailer
export async function sendWelcomeRetailerEmail(
  name: string,
  email: string,
  password: string
): Promise<boolean> {
  try {
    console.log(`📧 Sending welcome email to new retailer: ${name} (${email})`);
    
    const template = getWelcomeRetailerEmailTemplate(name, email, password);
    const success = await sendEmail(email, template);
    
    if (success) {
      console.log(`✅ Welcome email sent to retailer: ${name}`);
    } else {
      console.error(`❌ Failed to send welcome email to retailer: ${name}`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error sending welcome retailer email:', error);
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
    console.log(`📧 Sending welcome email to new employee: ${name} (${email})`);
    
    const template = getWelcomeEmployeeEmailTemplate(name, email, password);
    const success = await sendEmail(email, template);
    
    if (success) {
      console.log(`✅ Welcome email sent to employee: ${name}`);
    } else {
      console.error(`❌ Failed to send welcome email to employee: ${name}`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error sending welcome employee email:', error);
    return false;
  }
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
        </div>
      `,
      text: `Test Email from विघ्नहर्ता जनसेवा\n\nThis is a test email. If you received this, the email service is working!\n\nSent at: ${new Date().toLocaleString()}`
    };

    return await sendEmail(to, template);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return false;
  }
}
