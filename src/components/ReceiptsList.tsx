'use client';

import React, { useState } from 'react';
import { useRealTimeReceipts } from '@/hooks/useRealTimeReceipts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, DollarSign, User, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import jsPDF from 'jspdf';

interface Receipt {
  id: string;
  application_id: string;
  receipt_number: string;
  service_name: string;
  service_fee: number;
  processing_fee: number;
  total_amount: number;
  approval_date: string;
  created_at: string;
  retailer: {
    id: string;
    name: string;
    email: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  };
  application: {
    id: string;
    status: string;
    application_data: any;
  };
}

interface ReceiptsListProps {
  className?: string;
}

export default function ReceiptsList({ className }: ReceiptsListProps) {
  const { receipts, loading, error, refetch } = useRealTimeReceipts();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadReceipt = async (receiptId: string, receiptNumber: string) => {
    try {
      setDownloadingId(receiptId);
      
      const response = await fetch(`/api/receipts/${receiptId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch receipt data');
      }

      const data = await response.json();
      const receipt = data.receipt;

      // Generate professional PDF receipt
      const pdf = new jsPDF();

      // Set page background
      pdf.setFillColor(255, 255, 255); // White background
      pdf.rect(0, 0, 210, 297, 'F');

      // Header section with plain orange background
      pdf.setFillColor(255, 165, 0); // Plain orange background
      pdf.rect(0, 0, 210, 50, 'F');

      // Header text
      pdf.setTextColor(0, 0, 0); // Black text for better visibility on orange
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VIGNAHARTA JANSEVA', 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Government Services Portal', 105, 30, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SERVICE RECEIPT', 105, 42, { align: 'center' });

      // Receipt details section
      let yPos = 70;

      // Receipt number and date
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Receipt Number:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.receiptNumber, 70, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Issue Date:', 120, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatDateTime(receipt.approvalDate), 155, yPos);

      yPos += 20;
      // Service details section
      pdf.setDrawColor(220, 38, 38);
      pdf.setLineWidth(1);
      pdf.rect(20, yPos, 170, 50, 'D');

      pdf.setTextColor(220, 38, 38);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SERVICE DETAILS', 25, yPos + 12);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Service Name:', 25, yPos + 25);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.serviceName || 'N/A', 70, yPos + 25);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Service Fee:', 25, yPos + 35);
      pdf.setFont('helvetica', 'normal');
      const serviceFeeAmount = typeof receipt.serviceFee === 'string' ? parseFloat(receipt.serviceFee) : receipt.serviceFee;
      pdf.text(`Rs. ${serviceFeeAmount.toFixed(2)}`, 70, yPos + 35);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Processing Fee:', 25, yPos + 45);
      pdf.setFont('helvetica', 'normal');
      const processingFeeAmount = typeof receipt.processingFee === 'string' ? parseFloat(receipt.processingFee) : receipt.processingFee;
      pdf.text(`Rs. ${processingFeeAmount.toFixed(2)}`, 70, yPos + 45);

      // Total amount section
      yPos += 60;
      pdf.setFillColor(34, 197, 94);
      pdf.rect(20, yPos, 170, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const totalAmount = typeof receipt.totalAmount === 'string' ? parseFloat(receipt.totalAmount) : receipt.totalAmount;
      pdf.text(`TOTAL AMOUNT: Rs. ${totalAmount.toFixed(2)}`, 25, yPos + 10);

      yPos += 25;
      
      // Customer details section
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(1);
      pdf.rect(20, yPos, 170, 50, 'D');

      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CUSTOMER DETAILS', 25, yPos + 12);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Name:', 25, yPos + 25);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.retailer?.name || 'N/A', 50, yPos + 25);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Email:', 25, yPos + 35);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.retailer?.email || 'N/A', 50, yPos + 35);

      if (receipt.retailer?.phone) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Phone:', 25, yPos + 45);
        pdf.setFont('helvetica', 'normal');
        pdf.text(receipt.retailer.phone, 50, yPos + 45);
      }

      yPos += 60;

      // Processed by section
      pdf.setDrawColor(168, 85, 247);
      pdf.setLineWidth(1);
      pdf.rect(20, yPos, 170, 40, 'D');

      pdf.setTextColor(168, 85, 247);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROCESSED BY', 25, yPos + 12);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Employee:', 25, yPos + 25);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.employee?.name || 'N/A', 70, yPos + 25);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Email:', 25, yPos + 35);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.employee?.email || 'N/A', 55, yPos + 35);

      yPos += 50;
      
      // Add some spacing before footer
      yPos += 20;

      // Footer section
      pdf.setDrawColor(220, 38, 38);
      pdf.setLineWidth(2);
      pdf.line(20, yPos, 190, yPos);

      yPos += 10;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VIGNAHARTA JANSEVA - Government Services Portal', 105, yPos, { align: 'center' });

      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text('Support: +91-9819399470 | Email: shindeaniket47328@gmail.com', 105, yPos, { align: 'center' });

      yPos += 8;
      pdf.text('Serving citizens with dedication and transparency', 105, yPos, { align: 'center' });

      yPos += 12;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('This is a computer-generated receipt. No signature required.', 105, yPos, { align: 'center' });

      yPos += 6;
      pdf.text('Generated on: ' + new Date().toLocaleString(), 105, yPos, { align: 'center' });
      
      // Save PDF
      pdf.save(`Receipt_${receiptNumber}.pdf`);
      
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Service Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading receipts...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Service Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Service Receipts
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {receipts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No receipts found</p>
            <p className="text-sm text-gray-400 mt-2">
              Receipts will appear here when your service applications are approved
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{receipt.service_name}</h3>
                    <p className="text-sm text-gray-600">Receipt #{receipt.receipt_number}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Approved
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      Total: <span className="font-semibold">{formatCurrency(typeof receipt.total_amount === 'string' ? parseFloat(receipt.total_amount) : receipt.total_amount)}</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      Approved: {formatDateTime(receipt.approval_date)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      By: {receipt.employee.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => downloadReceipt(receipt.id, receipt.receipt_number)}
                    disabled={downloadingId === receipt.id}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {downloadingId === receipt.id ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
