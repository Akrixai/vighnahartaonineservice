'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { Download, Printer, Award, Calendar, User, Building, Hash } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Certificate {
  id: string;
  retailer_name: string;
  certificate_number: string;
  issue_date: string;
  company_name: string;
  digital_signature?: string;
}

export default function CertificatesPage() {
  const { data: session } = useSession();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  // Check retailer access
  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    // Generate or fetch certificate data
    const generateCertificate = async () => {
      try {
        // Generate certificate via API to ensure uniqueness and store in database
        const response = await fetch('/api/certificates/retailer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            retailer_name: session.user.name,
            retailer_id: session.user.id
          }),
        });

        const result = await response.json();

        if (result.success) {
          setCertificate(result.certificate);
        } else {
          throw new Error(result.error || 'Failed to generate certificate');
        }
      } catch (error) {
        console.error('Error generating certificate:', error);
        // Fallback to client-side generation if API fails
        const currentDate = new Date();
        const certificateNumber = `VJS-${currentDate.getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

        setCertificate({
          id: session.user.id,
          retailer_name: session.user.name,
          certificate_number: certificateNumber,
          issue_date: currentDate.toLocaleDateString('en-GB'),
          company_name: 'Vignaharta Janseva'
        });
      } finally {
        setLoading(false);
      }
    };

    generateCertificate();
  }, [session]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!certificate) return;

    try {
      const response = await fetch('/api/certificates/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificate),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Authorization_Certificate_${certificate.certificate_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        showToast.error('Download failed', {
          description: 'Failed to download certificate'
        });
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      showToast.error('Download failed', {
        description: 'Failed to download certificate'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading certificate...</p>
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
                Authorization Certificate
              </h1>
              <p className="text-red-100 text-xl">
                Your official retailer authorization certificate
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

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-8 print:hidden print-hide">
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            <Printer className="w-5 h-5 mr-2" />
            Print Certificate
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Certificate Display */}
        {certificate && (
          <div className="max-w-4xl mx-auto">
            <style jsx>{`
              @media print {
                @page {
                  size: A4;
                  margin: 20mm;
                }
                body {
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                .print-certificate {
                  page-break-inside: avoid;
                  width: 100%;
                  max-width: none;
                  margin: 0;
                  padding: 0;
                }
                .print-hide {
                  display: none !important;
                }
                .print-border {
                  border: 4px solid #dc2626 !important;
                  padding: 40px !important;
                }
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
                    RETAILER AUTHORIZATION CERTIFICATE
                  </h2>
                  <p className="text-gray-600">
                    This certificate authorizes the bearer to operate as an official retailer
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
                            <div className="text-sm text-gray-600">Retailer Name</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {certificate.retailer_name}
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
                  </div>

                  {/* Authorization Text */}
                  <div className="text-center py-6">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      This certificate hereby authorizes <strong>{certificate.retailer_name}</strong> to act as an
                      official retailer for <strong>{certificate.company_name}</strong> and to provide government
                      services to customers on behalf of the company. This authorization is valid from the date
                      of issue and remains active as long as the retailer maintains good standing with the company.
                    </p>
                  </div>

                  {/* Certificate Footer */}
                  <div className="border-t pt-6 mt-8">
                    <div className="flex justify-between items-end">
                      <div className="text-center">
                        <div className="w-32 h-16 border-b-2 border-gray-400 mb-2 flex items-end justify-center">
                          <div className="text-xs text-gray-700 font-signature italic">
                            Vignaharta Janseva
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">Authorized Signature</div>
                        <div className="text-xs text-gray-500 mt-1">Company Representative</div>
                        {certificate.digital_signature && (
                          <div className="text-xs text-gray-400 mt-2 font-mono">
                            Digital ID: {certificate.digital_signature.substring(0, 16)}...
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <div className="w-20 h-20 border-2 border-red-600 rounded-full flex items-center justify-center mb-2">
                          <div className="text-xs text-red-600 font-bold">OFFICIAL<br/>SEAL</div>
                        </div>
                        <div className="text-xs text-gray-500">Company Seal</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Certificate ID:</div>
                        <div className="text-xs font-mono text-gray-800">{certificate.certificate_number}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          Issued on {certificate.issue_date}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Information Card */}
        <Card className="bg-red-50 border-red-200 mt-8 print:hidden print-hide">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Certificate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-red-900 mb-2">Certificate Features:</h4>
                <ul className="space-y-1 text-red-700">
                  <li>• Unique certificate number for verification</li>
                  <li>• Official company authorization</li>
                  <li>• Valid for all government services</li>
                  <li>• Printable and downloadable PDF format</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-red-900 mb-2">Usage Guidelines:</h4>
                <ul className="space-y-1 text-red-700">
                  <li>• Present this certificate when required</li>
                  <li>• Keep the certificate number for reference</li>
                  <li>• Contact support for any verification needs</li>
                  <li>• Renew as per company policy</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}