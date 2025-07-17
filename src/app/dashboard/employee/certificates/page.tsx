'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { Award, Download, Printer, User, Building, Calendar, Hash, Shield, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import LogoSpinner, { PageLoader } from '@/components/ui/logo-spinner';

interface Certificate {
  id: string;
  employee_name: string;
  employee_id?: string;
  department?: string;
  branch?: string;
  certificate_number: string;
  issue_date: string;
  company_name: string;
  digital_signature: string;
}

export default function EmployeeCertificatesPage() {
  const { data: session } = useSession();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branch, setBranch] = useState('');

  // Check employee access
  if (!session || session.user.role !== UserRole.EMPLOYEE) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only employees can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    const fetchOrGenerateCertificate = async () => {
      try {
        // First try to get existing certificate
        const getResponse = await fetch('/api/certificates/employee');

        if (getResponse.ok) {
          const data = await getResponse.json();
          if (data.success && data.certificate) {
            setCertificate(data.certificate);
            setLoading(false);
            return;
          }
        }

        // If no certificate exists, generate one
        const generateResponse = await fetch('/api/certificates/employee', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_name: session.user.name,
            employee_id: session.user.employee_id || session.user.id.substring(0, 8),
            department: session.user.department || 'Government Services',
            branch: branch || 'Main Branch'
          })
        });

        if (generateResponse.ok) {
          const data = await generateResponse.json();
          if (data.success && data.certificate) {
            setCertificate(data.certificate);
          }
        } else {
          // Fallback to client-side generation if API fails
          const currentDate = new Date();
          const certificateNumber = `VJS-EMP-${currentDate.getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

          setCertificate({
            id: session.user.id,
            employee_name: session.user.name,
            employee_id: session.user.employee_id || session.user.id.substring(0, 8),
            department: session.user.department || 'Government Services',
            branch: branch || 'Main Branch',
            certificate_number: certificateNumber,
            issue_date: currentDate.toLocaleDateString('en-GB'),
            company_name: 'Vignaharta Janseva',
            digital_signature: `VJS-EMP-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
          });
        }
      } catch (err) {
        console.error('Error with certificate:', err);
        setError('Failed to generate certificate');
        // Fallback to client-side generation
        const currentDate = new Date();
        const certificateNumber = `VJS-EMP-${currentDate.getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

        setCertificate({
          id: session.user.id,
          employee_name: session.user.name,
          employee_id: session.user.employee_id || session.user.id.substring(0, 8),
          department: session.user.department || 'Government Services',
          branch: branch || 'Main Branch',
          certificate_number: certificateNumber,
          issue_date: currentDate.toLocaleDateString('en-GB'),
          company_name: 'Vignaharta Janseva',
          digital_signature: `VJS-EMP-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrGenerateCertificate();
    }
  }, [session]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!certificate) return;

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

      // Header with red background
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 50, 'F');

      // Company name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(certificate.company_name, 105, 25, { align: 'center' });

      // Certificate title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('EMPLOYEE AUTHORIZATION CERTIFICATE', 105, 40, { align: 'center' });

      // Certificate border
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(2);
      doc.rect(15, 60, 180, 200);

      // Certificate content
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('This certifies that the below named individual is an authorized employee', 105, 80, { align: 'center' });

      // Employee details section
      doc.setFillColor(...bgGray);
      doc.rect(25, 95, 160, 60, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Information', 105, 110, { align: 'center' });

      doc.setTextColor(...textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Employee name
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Name:', 35, 125);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.employee_name, 35, 135);

      // Certificate number
      doc.setFont('helvetica', 'bold');
      doc.text('Certificate Number:', 120, 125);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.certificate_number, 120, 135);

      // Employee ID
      doc.setFont('helvetica', 'bold');
      doc.text('Employee ID:', 35, 145);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.employee_id || 'N/A', 35, 155);

      // Department
      doc.setFont('helvetica', 'bold');
      doc.text('Department:', 120, 145);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.department || 'Government Services', 120, 155);

      // Company
      doc.setFont('helvetica', 'bold');
      doc.text('Company:', 35, 165);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.company_name, 35, 175);

      // Branch
      doc.setFont('helvetica', 'bold');
      doc.text('Branch:', 120, 165);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.branch || 'Main Branch', 120, 175);

      // Issue date
      doc.setFont('helvetica', 'bold');
      doc.text('Issue Date:', 35, 185);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.issue_date, 35, 195);

      // Authorization text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const authText = `This certificate hereby authorizes ${certificate.employee_name} (ID: ${certificate.employee_id || 'N/A'}) to act as an official employee of ${certificate.company_name} in the ${certificate.department || 'Government Services'} department at ${certificate.branch || 'Main Branch'} branch. This authorization is valid from the date of issue and remains active as long as the employee maintains good standing with the company.`;

      const splitText = doc.splitTextToSize(authText, 160);
      doc.text(splitText, 25, 205);

      // Verification section
      doc.setFillColor(254, 242, 242); // Light red background
      doc.rect(25, 240, 160, 30, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Certificate Verification', 105, 255, { align: 'center' });

      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Digital Signature: ${certificate.digital_signature}`, 105, 265, { align: 'center' });

      // Footer
      doc.setTextColor(...lightGray);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} | Certificate #${certificate.certificate_number}`, 105, 270, { align: 'center' });
      doc.text('Official Employee Authorization Certificate', 105, 280, { align: 'center' });

      // Save the PDF
      doc.save(`employee-certificate-${certificate.certificate_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF certificate. Please try again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader text="Generating your certificate..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!certificate) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Certificate Found</h1>
          <p className="text-gray-600">Unable to generate certificate at this time.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                <Award className="w-10 h-10 mr-3" />
                Employee Authorization Certificate
              </h1>
              <p className="text-red-100 text-xl">
                Your official employee authorization certificate
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm text-red-100">Certificate Status</div>
                <div className="text-2xl font-bold">ACTIVE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Input Form */}
        {!certificate && (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch/Location *
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Enter your branch or location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be displayed on your certificate
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center print:hidden">
          <Button
            onClick={handlePrint}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg"
          >
            <Printer className="w-5 h-5 mr-2" />
            Print Certificate
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 px-6 py-3 text-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Certificate */}
        <div className="flex justify-center">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-certificate, .print-certificate * { visibility: visible; }
              .print-certificate { position: absolute; left: 0; top: 0; width: 100%; }
              .print-border { border: 4px solid #dc2626 !important; }
            }
          `}</style>
          <Card className="border-4 border-red-600 shadow-2xl print:shadow-none print:border-4 print:border-red-600 print-certificate">
            <CardContent className="p-12 print:p-8 print-border">
              {/* Certificate Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                    <Award className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-red-600 mb-2">
                  {certificate.company_name}
                </h1>
                <div className="w-32 h-1 bg-red-600 mx-auto mb-4"></div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  EMPLOYEE AUTHORIZATION CERTIFICATE
                </h2>
                <p className="text-gray-600">
                  This certifies that the below named individual is an authorized employee
                </p>
              </div>

              {/* Certificate Body */}
              <div className="space-y-8">
                {/* Certificate Details */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <div className="text-sm text-gray-600">Employee Name</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {certificate.employee_name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Building className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <div className="text-sm text-gray-600">Company</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {certificate.company_name}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Hash className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <div className="text-sm text-gray-600">Certificate Number</div>
                          <div className="text-lg font-semibold text-gray-900 font-mono">
                            {certificate.certificate_number}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <div className="text-sm text-gray-600">Issue Date</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {certificate.issue_date}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employee Details */}
                  {(certificate.employee_id || certificate.department || certificate.branch) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {certificate.employee_id && (
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                              <div className="text-sm text-gray-600">Employee ID</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {certificate.employee_id}
                              </div>
                            </div>
                          </div>
                        )}

                        {certificate.department && (
                          <div className="flex items-center">
                            <Building className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                              <div className="text-sm text-gray-600">Department</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {certificate.department}
                              </div>
                            </div>
                          </div>
                        )}

                        {certificate.branch && (
                          <div className="flex items-center">
                            <Building className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                              <div className="text-sm text-gray-600">Branch</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {certificate.branch}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Authorization Text */}
                <div className="text-center py-6">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    This certificate hereby authorizes <strong>{certificate.employee_name}</strong> to act as an
                    official employee of <strong>{certificate.company_name}</strong> and to provide services
                    and assistance to customers on behalf of the company. This authorization is valid from the date
                    of issue and remains active as long as the employee maintains good standing with the company.
                  </p>
                </div>

                {/* Verification Section */}
                <div className="bg-red-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-red-600 mr-3" />
                    <h3 className="text-xl font-semibold text-red-600">Certificate Verification</h3>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      Digital Signature: <span className="font-mono text-xs">{certificate.digital_signature}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      This certificate can be verified by contacting {certificate.company_name} with the certificate number.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-gray-200">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-800">{certificate.company_name}</p>
                    <p className="text-sm text-gray-600">Official Employee Authorization Certificate</p>
                    <p className="text-xs text-gray-500">
                      Generated on {new Date().toLocaleDateString('en-GB')} | Certificate #{certificate.certificate_number}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
