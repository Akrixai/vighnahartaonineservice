'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types';
import { formatCurrency, formatCurrencyForPDF } from '@/lib/utils';
import { Package, Calendar, CreditCard, Truck, Download, Eye, RefreshCw } from 'lucide-react';

import jsPDF from 'jspdf';

interface Order {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string;
  amount: number;
  delivery_charges: number;
  payment_method: 'WALLET' | 'COD';
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  customer_details: any;
  created_at: string;
  updated_at: string;
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // All hooks must be declared before any conditional logic
  useEffect(() => {
    if (session?.user?.id) {
      fetchOrders();
      setupRealTimeUpdates();
    }
  }, [session]);

  // Check user access after all hooks are declared
  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const setupRealTimeUpdates = () => {
    if (!session?.user?.id) return;

    // Using Supabase real-time for order updates
    // This will be implemented with Supabase real-time subscriptions
    console.log('Real-time order updates will be implemented with Supabase');

    return () => {
      // Cleanup function for future Supabase subscription
    };
  };

  const fetchOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      console.log('🔄 Fetching orders for retailer...');
      const response = await fetch('/api/orders');
      console.log('📡 Orders API response status:', response.status);

      const result = await response.json();
      console.log('📦 Orders API result:', result);

      if (result.success) {
        setOrders(result.orders);
        console.log('✅ Orders loaded successfully:', result.orders.length, 'orders');
      } else {
        console.error('❌ Failed to fetch orders:', result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh orders to show updated status
        fetchOrders();
        console.log('✅ Order status updated successfully');
      } else {
        console.error('❌ Failed to update order status:', result.error);
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
    }
  };

  const handleDownloadReceipt = (order: Order) => {
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
      doc.text(new Date(order.created_at).toLocaleDateString('en-GB'), 140, 82);

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

      const customerName = order.customer_details.name || order.customer_details.customerName || 'N/A';
      const customerPhone = order.customer_details.phone || order.customer_details.customerPhone || 'N/A';
      const customerEmail = order.customer_details.email || order.customer_details.customerEmail || 'N/A';

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

      if (order.customer_details.address) {
        doc.setFont('helvetica', 'bold');
        doc.text('Address:', 25, 201);
        doc.setFont('helvetica', 'normal');
        const address = `${order.customer_details.address}, ${order.customer_details.city || ''}, ${order.customer_details.state || ''} - ${order.customer_details.pincode || ''}`;
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
      doc.text(formatCurrencyForPDF(productPrice), 150, 237);

      doc.text(`Delivery Charges:`, 25, 245);
      doc.text(formatCurrencyForPDF(order.delivery_charges), 150, 245);

      // Total amount highlight
      doc.setFillColor(...primaryColor);
      doc.rect(20, 255, 170, 15, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL AMOUNT:', 25, 265);
      doc.text(formatCurrencyForPDF(order.amount), 150, 265);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                <Package className="w-10 h-10 mr-3" />
                {session.user.role === UserRole.RETAILER ? 'My Orders' : 'Order Management'}
              </h1>
              <p className="text-red-100 text-xl">
                {session.user.role === UserRole.RETAILER
                  ? 'Track your product orders and download receipts'
                  : 'Manage all customer orders and track deliveries'
                }
              </p>
              <div className="mt-4 flex items-center gap-4 text-red-100">
                <span>📦 {orders.length} Orders</span>
                <span>•</span>
                <span>🎯 Real-time Updates</span>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">You haven't placed any orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.product_name}</CardTitle>
                      <CardDescription>Order ID: {order.id}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{order.payment_method}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Delivery: {formatCurrency(order.delivery_charges)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(order.amount)}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => window.open(`/dashboard/orders/${order.id}/receipt`, '_blank')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Receipt
                      </Button>
                      <Button
                        onClick={() => handleDownloadReceipt(order)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>

                      {/* Status Update Buttons for Admin/Employee */}
                      {(session.user.role === UserRole.ADMIN || session.user.role === UserRole.EMPLOYEE) && (
                        <>
                          {order.status === 'PENDING' && (
                            <Button
                              onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              Confirm Order
                            </Button>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <Button
                              onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Mark Shipped
                            </Button>
                          )}
                          {order.status === 'SHIPPED' && (
                            <Button
                              onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
