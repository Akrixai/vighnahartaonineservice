import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const certificate = await request.json();

    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set up colors
      const primaryColor = [220, 38, 38]; // Red color
      const textColor = [31, 41, 55]; // Dark gray
      const lightGray = [156, 163, 175]; // Light gray
      const bgGray = [249, 250, 251]; // Background gray

      // Header with plain orange background
      doc.setFillColor(255, 165, 0); // Plain orange background
      doc.rect(0, 0, 210, 50, 'F');

      // Company name
      doc.setTextColor(0, 0, 0); // Black text for better visibility
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(certificate.company_name, 105, 25, { align: 'center' });

      // Certificate title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('RETAILER AUTHORIZATION CERTIFICATE', 105, 40, { align: 'center' });

      // Certificate border
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(2);
      doc.rect(15, 60, 180, 200);

      // Certificate content
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('This certifies that the below named individual is an authorized retailer', 105, 80, { align: 'center' });

      // Retailer details section
      doc.setFillColor(...bgGray);
      doc.rect(25, 95, 160, 60, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Retailer Information', 105, 110, { align: 'center' });

      doc.setTextColor(...textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Retailer name
      doc.setFont('helvetica', 'bold');
      doc.text('Retailer Name:', 35, 125);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.retailer_name, 35, 135);

      // Certificate number
      doc.setFont('helvetica', 'bold');
      doc.text('Certificate Number:', 120, 125);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.certificate_number, 120, 135);

      // Company
      doc.setFont('helvetica', 'bold');
      doc.text('Company:', 35, 145);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.company_name, 35, 155);

      // Branch
      doc.setFont('helvetica', 'bold');
      doc.text('Branch:', 35, 165);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.branch || 'Main Branch', 35, 175);

      // Issue date
      doc.setFont('helvetica', 'bold');
      doc.text('Issue Date:', 120, 145);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.issue_date, 120, 155);

      // Authorization text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const authText = `This certificate hereby authorizes ${certificate.retailer_name} to act as an official retailer for ${certificate.company_name} at ${certificate.branch || 'Main Branch'} branch and to provide government services to customers on behalf of the company. This authorization is valid from the date of issue and remains active as long as the retailer maintains good standing with the company.`;

      const splitText = doc.splitTextToSize(authText, 160);
      doc.text(splitText, 25, 185);

      // Verification section
      doc.setFillColor(254, 242, 242); // Light red background
      doc.rect(25, 220, 160, 30, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Certificate Verification', 105, 235, { align: 'center' });

      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Digital Signature: VJS-${certificate.certificate_number}-VERIFIED`, 105, 245, { align: 'center' });

      // Footer
      doc.setTextColor(...lightGray);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} | Certificate #${certificate.certificate_number}`, 105, 270, { align: 'center' });
      doc.text('Official Retailer Authorization Certificate', 105, 280, { align: 'center' });

      // Generate PDF buffer
      const pdfBuffer = doc.output('arraybuffer');

      // Return PDF response
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Authorization_Certificate_${certificate.certificate_number}.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
        },
      });

    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      throw pdfError;
    }



  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ 
      error: 'Failed to generate certificate' 
    }, { status: 500 });
  }
}
