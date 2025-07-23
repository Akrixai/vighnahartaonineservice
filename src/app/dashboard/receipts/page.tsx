'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import ReceiptsList from '@/components/ReceiptsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, CheckCircle } from 'lucide-react';

export default function ReceiptsPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your receipts.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <FileText className="w-10 h-10 mr-3" />
            Service Receipts
          </h1>
          <p className="text-green-100 text-xl">
            Download and manage receipts for your approved service applications
          </p>
          <div className="mt-4 flex items-center gap-4 text-green-100">
            <span>📄 Digital Receipts</span>
            <span>•</span>
            <span>💾 PDF Downloads</span>
            <span>•</span>
            <span>🔒 Secure & Official</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-blue-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Automatic Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Receipts are automatically generated when your service applications are approved by our team.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-green-700">
                <Download className="w-5 h-5 mr-2" />
                PDF Downloads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download official PDF receipts with all service details, fees, and approval information.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-purple-700">
                <FileText className="w-5 h-5 mr-2" />
                Official Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All receipts are official documents that can be used for record-keeping and verification purposes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Receipts List */}
        <ReceiptsList />

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <p>Receipts are generated automatically when your service applications are approved</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <p>Click "Download PDF" to save the receipt to your device</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <p>Keep receipts for your records and future reference</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <p>Contact support if you have any issues with your receipts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
