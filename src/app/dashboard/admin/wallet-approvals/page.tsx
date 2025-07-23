'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { CheckCircle, XCircle, Clock, User, Calendar, IndianRupee, Eye } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface WalletRequest {
  id: string;
  user_id: string;
  type: string;
  amount: string;
  status: string;
  payment_method: string;
  transaction_reference: string;
  screenshot_url?: string;
  description: string;
  metadata: any;
  processed_by?: string;
  processed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function WalletApprovalsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // All hooks must be declared before any conditional logic
  useEffect(() => {
    // Only fetch if user has proper access
    if (session && ['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      fetchRequests();

      // Poll for new requests every 30 seconds
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Check admin/employee access - moved after all hooks
  if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only admins and employees can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/wallet-requests?status=PENDING');
      const result = await response.json();

      if (result.success) {
        setRequests(result.requests || []);
      }
    } catch (error) {
      console.error('Error fetching wallet requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (transactionId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string, isTransaction?: boolean) => {
    setProcessingId(transactionId);
    try {
      const response = await fetch('/api/admin/wallet-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: transactionId,
          action,
          rejection_reason: rejectionReason,
          is_transaction: isTransaction || false
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove the processed request from the list
        setRequests(prev => prev.filter(req => req.id !== transactionId));
        showToast.success(result.message);
      } else {
        throw new Error(result.error || `Failed to ${action.toLowerCase()} payment`);
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing payment:`, error);
      showToast.error(`Failed to ${action.toLowerCase()} payment`, {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getPaymentMethodDisplay = (paymentMethod: string, metadata: any) => {
    if (!paymentMethod) return 'Unknown';

    if (paymentMethod === 'UPI') {
      return `UPI (${metadata?.upi_id || 'N/A'})`;
    } else if (paymentMethod === 'UPI_QR') {
      return 'UPI QR Code';
    } else if (paymentMethod === 'BANK_TRANSFER') {
      return 'Bank Transfer';
    } else if (paymentMethod === 'CASH') {
      return 'Cash Deposit';
    }

    return paymentMethod || 'Unknown';
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(parseFloat(amount));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">💳 Wallet Payment Approvals</h1>
          <p className="text-red-100">Review and approve wallet top-up requests</p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span>{requests.length} Pending Approvals</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending wallet payment requests at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((request) => (
              <Card key={request.id} className={`border-l-4 ${
                request.type === 'TOPUP' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {request.type === 'TOPUP' ? (
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💰</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💸</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className={`text-lg font-bold ${
                          request.type === 'TOPUP' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {request.type === 'TOPUP' ? '💰 ADD MONEY REQUEST' : '💸 WITHDRAW MONEY REQUEST'}
                        </CardTitle>
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-600">{request.users.name}</span>
                            <span className="text-gray-500">({request.users.email})</span>
                          </div>
                          {request.users.phone && (
                            <span className="block text-sm text-gray-500 ml-6">📞 {request.users.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${
                        request.type === 'TOPUP' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {request.type === 'TOPUP' ? '+' : '-'}{formatCurrency(request.amount)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Action Summary */}
                  <div className={`p-4 rounded-lg border-2 ${
                    request.type === 'TOPUP'
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-red-100 border-red-300 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-lg">
                      {request.type === 'TOPUP' ? '✅' : '⚠️'}
                      <span>
                        {request.type === 'TOPUP'
                          ? `Will ADD ${formatCurrency(request.amount)} to retailer's wallet`
                          : `Will DEDUCT ${formatCurrency(request.amount)} from retailer's wallet`
                        }
                      </span>
                    </div>
                    <p className="text-sm mt-1 opacity-90">
                      {request.type === 'TOPUP'
                        ? 'Retailer has made a payment and wants to add money to their wallet balance.'
                        : request.payment_method === 'UPI_QR'
                        ? 'Retailer wants to withdraw money via UPI. Scan their QR code to transfer money directly.'
                        : 'Retailer wants to withdraw money from their wallet to their bank account.'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Payment Method:</span>
                      <p className="text-gray-600">{getPaymentMethodDisplay(request.payment_method, request.metadata)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Transaction ID:</span>
                      <p className="text-gray-600 font-mono text-xs">{request.transaction_reference || 'N/A'}</p>
                    </div>
                  </div>

                  {/* QR Code for Withdrawal Requests */}
                  {request.type === 'WITHDRAWAL' && request.metadata?.qr_code_url && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Withdrawal QR Code:</span>
                      <div className="mt-2 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImage(request.metadata.qr_code_url)}
                          className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Eye className="w-4 h-4" />
                          View QR Code
                        </Button>
                        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                          💡 This QR code contains the retailer's UPI details for direct money transfer
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Screenshot for Top-up Requests */}
                  {request.screenshot_url && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Payment Screenshot:</span>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImage(request.screenshot_url)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Screenshot
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-600">{request.description}</p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleApproval(request.id, 'APPROVE', undefined, request.metadata?.original_transaction)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processingId === request.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => {
                        showToast.prompt('Enter rejection reason', {
                          description: 'Enter rejection reason (optional):',
                          placeholder: 'Enter reason...',
                          onSubmit: (reason: string) => {
                            handleApproval(request.id, 'REJECT', reason, request.metadata?.original_transaction);
                          },
                          onCancel: () => {
                            handleApproval(request.id, 'REJECT', '', request.metadata?.original_transaction);
                          }
                        });
                      }}
                      disabled={processingId === request.id}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto shadow-2xl border-0">
              <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    {selectedImage.includes('withdrawal-qr-codes') ? (
                      <>
                        <span className="mr-2">📱</span>
                        Withdrawal QR Code
                      </>
                    ) : (
                      <>
                        <span className="mr-2">📸</span>
                        Payment Screenshot
                      </>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedImage.includes('withdrawal-qr-codes')
                      ? 'Scan this QR code to transfer money to retailer\'s UPI account'
                      : 'Screenshot provided by retailer as payment proof'
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="hover:bg-gray-200"
                >
                  <span className="mr-1">✕</span>
                  Close
                </Button>
              </div>
              <div className="p-6">
                <div className="flex justify-center">
                  <img
                    src={selectedImage}
                    alt={selectedImage.includes('withdrawal-qr-codes') ? 'Withdrawal QR Code' : 'Payment Screenshot'}
                    className="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"
                    style={{ maxHeight: '70vh' }}
                  />
                </div>
                {selectedImage.includes('withdrawal-qr-codes') && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <span className="mr-2">💡</span>
                      How to process this withdrawal:
                    </h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Open your UPI app (PhonePe, Google Pay, Paytm, etc.)</li>
                      <li>2. Scan the QR code above</li>
                      <li>3. Enter the withdrawal amount</li>
                      <li>4. Complete the payment</li>
                      <li>5. Click "Approve" below to mark as processed</li>
                    </ol>
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
