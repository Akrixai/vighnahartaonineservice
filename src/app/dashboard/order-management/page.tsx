'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Package, Search, Filter, Eye, CheckCircle, XCircle, Clock, Truck, Bell, RefreshCw } from 'lucide-react';


interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string;
  user_name: string;
  user_email: string;
  quantity: number;
  amount: number;
  delivery_charges: number;
  payment_method: string;
  status: string;
  customer_details: any;
  created_at: string;
  updated_at: string;
}

export default function OrderManagementPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [newOrderNotifications, setNewOrderNotifications] = useState(0);

  // Check access
  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only admin and employees can access order management.</p>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    if (session?.user?.role) {
      fetchOrders();
      setupRealTimeNotifications();
    }
  }, [session]);

  const setupRealTimeNotifications = () => {
    if (!session?.user?.role) return;

    // Using Supabase real-time for order notifications
    // This will be implemented with Supabase real-time subscriptions
    console.log('Real-time order notifications will be implemented with Supabase');

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      // Cleanup function for future Supabase subscription
    };
  };

  const fetchOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      console.log('🔄 Fetching orders for admin/employee...');
      const response = await fetch('/api/orders');
      console.log('📡 Orders API response status:', response.status);

      const result = await response.json();
      console.log('📦 Orders API result:', result);

      if (result.success) {
        setOrders(result.orders);
        console.log('✅ Orders loaded successfully:', result.orders.length, 'orders');
        // Clear new order notifications when orders are refreshed
        setNewOrderNotifications(0);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || order.payment_method === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                <Package className="w-10 h-10 mr-3" />
                Order Management
                {newOrderNotifications > 0 && (
                  <div className="relative ml-3">
                    <Bell className="w-6 h-6 text-yellow-300 animate-pulse" />
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {newOrderNotifications}
                    </span>
                  </div>
                )}
              </h1>
              <p className="text-red-100 text-xl">
                Manage and track all retailer orders
              </p>
              <div className="mt-4 flex items-center gap-4 text-red-100">
                <span>📦 {orders.length} Total Orders</span>
                <span>•</span>
                <span>⏳ {orders.filter(o => o.status === 'PENDING').length} Pending</span>
                <span>•</span>
                <span>✅ {orders.filter(o => o.status === 'DELIVERED').length} Delivered</span>
                {newOrderNotifications > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-yellow-300 font-semibold animate-pulse">
                      🔔 {newOrderNotifications} New Order{newOrderNotifications > 1 ? 's' : ''}!
                    </span>
                  </>
                )}
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Payment Methods</SelectItem>
                  <SelectItem value="WALLET">Wallet Payment</SelectItem>
                  <SelectItem value="COD">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setPaymentFilter('ALL');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="grid gap-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
                <p className="text-gray-500">No orders match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Order Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start space-x-4">
                        {order.product_image_url ? (
                          <img
                            src={order.product_image_url}
                            alt={order.product_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            📦
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{order.product_name}</h3>
                          <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                          <p className="text-sm text-gray-600">Customer: {order.user_name}</p>
                          <p className="text-sm text-gray-600">Retailer: {order.customer_details?.customerName || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Phone: {order.customer_details?.customerPhone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Amount:</span>
                          <span className="font-semibold">{formatCurrency(order.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment:</span>
                          <Badge variant="outline">
                            {order.payment_method === 'WALLET' ? '💰 Wallet' : '💵 COD'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Date:</span>
                          <span className="text-sm">{formatDateTime(order.created_at)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => window.open(`/dashboard/orders/${order.id}/receipt`, '_blank')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Receipt
                      </Button>
                      
                      {order.status === 'PENDING' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          Confirm Order
                        </Button>
                      )}
                      
                      {order.status === 'CONFIRMED' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          Start Processing
                        </Button>
                      )}
                      
                      {order.status === 'PROCESSING' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                        >
                          Mark Shipped
                        </Button>
                      )}
                      
                      {order.status === 'SHIPPED' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          Mark Delivered
                        </Button>
                      )}
                      
                      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          variant="destructive"
                          size="sm"
                        >
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
