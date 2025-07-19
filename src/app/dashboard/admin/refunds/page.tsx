'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, FileText, User, Phone, QrCode, AlertCircle, CheckCircle, Clock, X, Eye, MessageSquare } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/layout';
import { showToast } from '@/lib/toast';

interface Refund {
  id: string;
  amount: number;
  reason: string;
  description: string;
  documents: string[];
  contact_number: string;
  qr_screenshot_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  admin_response: string;
  created_at: string;
  processed_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  application?: {
    id: string;
    scheme_id: string;
    customer_name: string;
  };
  processed_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminRefundsPage() {
  const { data: session } = useSession();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  const fetchRefunds = async () => {
    try {
      const url = statusFilter && statusFilter !== 'all' ? `/api/refunds?status=${statusFilter}` : '/api/refunds';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRefunds(Array.isArray(data) ? data : []);
      } else {
        setRefunds([]);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      showToast.error('Failed to load refunds');
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (refundId: string, status: string) => {
    if (!selectedRefund) return;

    setProcessing(refundId);
    try {
      const response = await fetch(`/api/refunds/${refundId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_response: adminResponse.trim() || undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast.success(`Refund ${status.toLowerCase()} successfully!`);
        setSelectedRefund(null);
        setAdminResponse('');
        fetchRefunds();
      } else {
        showToast.error(result.error || 'Failed to update refund');
      }
    } catch (error) {
      console.error('Error updating refund:', error);
      showToast.error('Error updating refund');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <X className="w-4 h-4" />;
      case 'PROCESSED': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'EMPLOYEE') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators and employees can access refund management.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <RefreshCw className="w-10 h-10 mr-3" />
            Refund Management
          </h1>
          <p className="text-red-100 text-xl">
            Review and process retailer refund requests
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Label htmlFor="status-filter">Filter by Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="PROCESSED">Processed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={fetchRefunds}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Refunds List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <FileText className="w-5 h-5 mr-2" />
              Refund Requests ({refunds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading refunds...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg">No refund requests found</p>
                <p className="text-gray-500">Refund requests will appear here when submitted by retailers</p>
              </div>
            ) : (
              <div className="space-y-4">
                {refunds.map((refund) => (
                  <div key={refund.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold text-lg">₹{refund.amount.toLocaleString()}</h3>
                          <Badge className={getStatusColor(refund.status)}>
                            {getStatusIcon(refund.status)}
                            <span className="ml-1">{refund.status}</span>
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{refund.reason}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {refund.user.name}
                          </span>
                          {refund.contact_number && (
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {refund.contact_number}
                            </span>
                          )}
                          <span>Submitted: {new Date(refund.created_at).toLocaleDateString()}</span>
                        </div>

                        {refund.application && (
                          <p className="text-sm text-gray-500 mt-1">
                            Related to: {refund.application.customer_name}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setSelectedRefund(refund)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    {refund.description && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                        <p className="text-sm text-gray-600">{refund.description}</p>
                      </div>
                    )}

                    {refund.qr_screenshot_url && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <QrCode className="w-4 h-4 mr-1" />
                          QR Screenshot:
                        </p>
                        <a
                          href={refund.qr_screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Screenshot
                        </a>
                      </div>
                    )}

                    {refund.admin_response && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-700 mb-1">Admin Response:</p>
                        <p className="text-sm text-blue-600">{refund.admin_response}</p>
                        {refund.processed_by_user && (
                          <p className="text-xs text-blue-500 mt-1">
                            By: {refund.processed_by_user.name} on {new Date(refund.processed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund Details Modal */}
        {selectedRefund && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Refund Details</h2>
                  <Button
                    onClick={() => setSelectedRefund(null)}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Amount</p>
                      <p className="text-lg font-semibold">₹{selectedRefund.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <Badge className={getStatusColor(selectedRefund.status)}>
                        {getStatusIcon(selectedRefund.status)}
                        <span className="ml-1">{selectedRefund.status}</span>
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Retailer</p>
                    <p>{selectedRefund.user.name} ({selectedRefund.user.email})</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Reason</p>
                    <p>{selectedRefund.reason}</p>
                  </div>

                  {selectedRefund.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-gray-600">{selectedRefund.description}</p>
                    </div>
                  )}
                </div>

                {selectedRefund.status === 'PENDING' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="admin-response">Admin Response (Optional)</Label>
                      <Textarea
                        id="admin-response"
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Add a response message for the retailer..."
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        onClick={() => handleStatusUpdate(selectedRefund.id, 'APPROVED')}
                        disabled={processing === selectedRefund.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing === selectedRefund.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedRefund.id, 'REJECTED')}
                        disabled={processing === selectedRefund.id}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {processing === selectedRefund.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        Reject
                      </Button>
                      {selectedRefund.status === 'APPROVED' && (
                        <Button
                          onClick={() => handleStatusUpdate(selectedRefund.id, 'PROCESSED')}
                          disabled={processing === selectedRefund.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {processing === selectedRefund.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Mark as Processed
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
