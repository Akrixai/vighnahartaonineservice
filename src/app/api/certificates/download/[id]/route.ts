import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - Download certificate (Retailer only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const certificateId = params.id;

    // Get certificate record
    const { data: certificate, error } = await supabaseAdmin
      .from('certificate_generations')
      .select('*')
      .eq('id', certificateId)
      .eq('user_id', session.user.id) // Ensure user can only download their own certificates
      .single();

    if (error || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // In a real implementation, this would:
    // 1. Generate PDF from template and data
    // 2. Return the PDF file as response
    
    // For demo purposes, return certificate data as JSON
    const pdfContent = generateCertificatePDF(certificate);
    
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${certificate.template_name}-${certificate.id}.html"`
      }
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Generate proper PDF certificate
function generateCertificatePDF(certificate: {
  id: string;
  employee_name: string;
  issue_date: string;
  certificate_data?: any;
}): Buffer {
  // Create a simple PDF-like content with proper formatting
  // In production, you would use a proper PDF library like PDFKit or puppeteer

  const certificateData = certificate.certificate_data || {};
  const templateName = certificate.template_name || 'Certificate';

  // Create HTML content for the certificate
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificate - ${templateName}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: white;
            color: #333;
        }
        .certificate {
            max-width: 800px;
            margin: 0 auto;
            border: 8px solid #d4af37;
            padding: 60px;
            text-align: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        .header {
            margin-bottom: 40px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 10px;
        }
        .title {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .subtitle {
            font-size: 18px;
            color: #7f8c8d;
            margin-bottom: 40px;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            margin: 30px 0;
            text-align: left;
        }
        .field {
            margin: 15px 0;
            padding: 10px;
            background: #f8f9fa;
            border-left: 4px solid #d4af37;
        }
        .field-label {
            font-weight: bold;
            color: #2c3e50;
        }
        .field-value {
            color: #34495e;
            margin-left: 10px;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
        }
        .certificate-id {
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 30px;
        }
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
            text-align: center;
        }
        .signature {
            flex: 1;
            margin: 0 20px;
        }
        .signature-line {
            border-top: 2px solid #333;
            margin-top: 60px;
            padding-top: 10px;
            font-size: 14px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="logo">🏛️ VIGNAHARTA JANSEVA KENDRA</div>
            <div style="font-size: 14px; color: #7f8c8d;">Government of India</div>
        </div>

        <div class="title">Certificate of Authorization</div>
        <div class="subtitle">${templateName}</div>

        <div class="content">
            <p style="text-align: center; font-size: 18px; margin-bottom: 30px;">
                This is to certify that the following details have been verified and authorized:
            </p>

            ${Object.entries(certificateData).map(([key, value]) => `
                <div class="field">
                    <span class="field-label">${key.replace(/_/g, ' ').toUpperCase()}:</span>
                    <span class="field-value">${value}</span>
                </div>
            `).join('')}
        </div>

        <div class="signature-section">
            <div class="signature">
                <div class="signature-line">Authorized Officer</div>
            </div>
            <div class="signature">
                <div class="signature-line">Digital Seal</div>
            </div>
        </div>

        <div class="footer">
            <div class="certificate-id">
                Certificate ID: VJS-${certificate.id}<br>
                Generated on: ${new Date(certificate.created_at).toLocaleDateString('en-IN')}<br>
                Valid from: ${new Date().toLocaleDateString('en-IN')}
            </div>
        </div>
    </div>
</body>
</html>`;

  // For now, return HTML content as PDF (browsers can print this as PDF)
  // In production, use puppeteer or similar to convert HTML to PDF
  return Buffer.from(htmlContent, 'utf-8');
}
