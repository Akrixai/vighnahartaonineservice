'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CheckCircle, Download, Printer, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';

interface Order {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string;
  amount: number;
  delivery_charges: number;
  payment_method: string;
  status: string;
  customer_details: any;
  created_at: string;
  updated_at: string;
}

export default function OrderReceiptPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !orderId) return;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();
        
        if (result.success) {
          setOrder(result.order);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [session, orderId]);

  // Check access - allow retailers, admin, and employees
  if (!session || ![UserRole.RETAILER, UserRole.ADMIN, UserRole.EMPLOYEE].includes(session.user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view order receipts.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order receipt...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <Button onClick={() => router.push('/dashboard/orders')} className="bg-red-600 hover:bg-red-700 text-white">
            View All Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
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
      const successColor = [34, 197, 94]; // Green color

      // Header with plain orange background
      doc.setFillColor(255, 165, 0); // Plain orange background
      doc.rect(0, 0, 210, 45, 'F');

      doc.setTextColor(0, 0, 0); // Black text for better visibility
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('Vignaharta Janseva', 105, 22, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Government Service Portal', 105, 32, { align: 'center' });

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER RECEIPT', 105, 42, { align: 'center' });

      // Receipt border
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.rect(15, 55, 180, 220);

      // Order Information Section
      doc.setFillColor(...bgGray);
      doc.rect(20, 60, 170, 35, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Information', 25, 72);

      doc.setTextColor(...textColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Two column layout for order info
      doc.setFont('helvetica', 'bold');
      doc.text('Order ID:', 25, 82);
      doc.setFont('helvetica', 'normal');
      doc.text(order.id.substring(0, 20) + '...', 55, 82);

      doc.setFont('helvetica', 'bold');
      doc.text('Date:', 120, 82);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDateTime(order.created_at).split(',')[0], 140, 82);

      doc.setFont('helvetica', 'bold');
      doc.text('Status:', 25, 90);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...successColor);
      doc.text(order.status, 50, 90);

      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment:', 120, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(order.payment_method === 'WALLET' ? 'Wallet Payment' : 'Cash on Delivery', 150, 90);

      // Product Details Section
      doc.setFillColor(255, 255, 255);
      doc.rect(20, 105, 170, 40, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Product Details', 25, 117);

      doc.setTextColor(...textColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Product Name:', 25, 127);
      doc.setFont('helvetica', 'normal');
      const productName = order.product_name.length > 40 ? order.product_name.substring(0, 40) + '...' : order.product_name;
      doc.text(productName, 25, 135);

      // Price breakdown
      doc.setFont('helvetica', 'bold');
      doc.text('Price Breakdown:', 25, 145);

      // Customer Details Section
      doc.setFillColor(...bgGray);
      doc.rect(20, 155, 170, 50, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Details', 25, 167);

      doc.setTextColor(...textColor);
      doc.setFontSize(11);

      const customerName = order.customer_details?.customerName || order.customer_details?.name || 'N/A';
      const customerPhone = order.customer_details?.customerPhone || order.customer_details?.phone || 'N/A';
      const customerEmail = order.customer_details?.customerEmail || order.customer_details?.email || 'N/A';

      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 25, 177);
      doc.setFont('helvetica', 'normal');
      doc.text(customerName, 50, 177);

      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', 25, 185);
      doc.setFont('helvetica', 'normal');
      doc.text(customerPhone, 50, 185);

      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 25, 193);
      doc.setFont('helvetica', 'normal');
      const emailText = customerEmail.length > 35 ? customerEmail.substring(0, 35) + '...' : customerEmail;
      doc.text(emailText, 50, 193);

      if (order.customer_details?.address) {
        doc.setFont('helvetica', 'bold');
        doc.text('Address:', 25, 201);
        doc.setFont('helvetica', 'normal');
        const address = order.customer_details.address;
        const addressLines = doc.splitTextToSize(address, 140);
        doc.text(addressLines, 60, 201);
      }

      // Payment Summary Section
      doc.setFillColor(255, 255, 255);
      doc.rect(20, 215, 170, 35, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Summary', 25, 227);

      doc.setTextColor(...textColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Price details
      const productPrice = order.amount - order.delivery_charges;
      doc.text(`Product Price:`, 25, 237);
      doc.text(formatCurrency(productPrice), 150, 237);

      doc.text(`Delivery Charges:`, 25, 245);
      doc.text(formatCurrency(order.delivery_charges), 150, 245);

      // Total amount highlight
      doc.setFillColor(...primaryColor);
      doc.rect(20, 255, 170, 15, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL AMOUNT:', 25, 265);
      doc.text(formatCurrency(order.amount), 150, 265);

      // Footer
      doc.setTextColor(...lightGray);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for choosing Vignaharta Janseva!', 105, 285, { align: 'center' });
      doc.text('For support, contact: support@vignahartajanseva.gov.in', 105, 292, { align: 'center' });

      // Save the PDF
      doc.save(`order-receipt-${order.id.substring(0, 8)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF receipt. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/orders')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Success Message */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h1>
            <p className="text-green-700">
              Your order has been confirmed and will be processed shortly.
            </p>
          </CardContent>
        </Card>

        {/* Receipt */}
        <Card className="print:shadow-none">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white print:bg-gray-100 print:text-black">
            <div className="text-center">
              <CardTitle className="text-2xl mb-2">VIGNAHARTA JANSEVA KENDRA</CardTitle>
              <p className="text-red-100 print:text-gray-600">Order Receipt</p>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                <p className="text-sm text-gray-600">Order ID: <span className="font-mono">{order.id}</span></p>
                <p className="text-sm text-gray-600">Date: {formatDateTime(order.created_at)}</p>
                <p className="text-sm text-gray-600">Status: <span className="capitalize">{order.status}</span></p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <p className="text-sm text-gray-600">Name: {order.customer_details?.customerName || order.customer_details?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">Phone: {order.customer_details?.customerPhone || order.customer_details?.phone || 'N/A'}</p>
                <p className="text-sm text-gray-600">Email: {order.customer_details?.customerEmail || order.customer_details?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="flex items-start space-x-4">
                {order.product_image_url ? (
                  <img
                    src={order.product_image_url}
                    alt={order.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    📦
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{order.product_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">Quantity: 1</p>
                  <p className="text-sm text-gray-600">Price: {formatCurrency(order.amount - order.delivery_charges)}</p>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.customer_details?.address && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                <div className="text-sm text-gray-600">
                  <p>{order.customer_details.address}</p>
                  {order.customer_details.landmark && <p>Landmark: {order.customer_details.landmark}</p>}
                  <p>{order.customer_details.city}, {order.customer_details.state} - {order.customer_details.pincode}</p>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Product Price:</span>
                  <span>{formatCurrency(order.amount - order.delivery_charges)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Charges:</span>
                  <span>{formatCurrency(order.delivery_charges)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-red-600">{formatCurrency(order.amount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {order.payment_method === 'WALLET' ? '💰 Wallet Payment' : '💵 Cash on Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 mt-8 text-center text-sm text-gray-600">
              <p>Thank you for your order!</p>
              <p>For any queries, please contact our support team.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
