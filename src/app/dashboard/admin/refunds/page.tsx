'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { RefreshCw, DollarSign, Clock, CheckCircle, XCircle, User, Calendar, Eye } from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'SCHEME_PAYMENT' | 'REFUND' | 'COMMISSION';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function RefundsManagementPage() {
  const { data: session } = useSession();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const { data: transactions, loading: transactionsLoading, refresh } = useRealTimeData<Transaction>({
    table: 'transactions',
    orderBy: { column: 'created_at', ascending: false },
    select: `
      *,
      users (
        id,
        name,
        email
      )
    `,
    enabled: session?.user?.role === UserRole.ADMIN
  });

  // Filter for refund-eligible transactions
  const refundEligibleTransactions = transactions?.filter(t => 
    t.type === 'SCHEME_PAYMENT' && t.status === 'COMPLETED'
  ) || [];

  // Filter for existing refunds
  const refundTransactions = transactions?.filter(t => 
    t.type === 'REFUND'
  ) || [];

  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefund = async (transactionId: string) => {
    if (!refundAmount || !refundReason) {
      alert('Please enter refund amount and reason');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_transaction_id: transactionId,
          amount,
          reason: refundReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      setRefundAmount('');
      setRefundReason('');
      setSelectedTransaction(null);
      refresh();
      alert('Refund processed successfully!');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const updateRefundStatus = async (refundId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/refunds/${refundId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update refund status');
      }

      refresh();
    } catch (error) {
      console.error('Error updating refund status:', error);
      alert('Failed to update refund status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
            <p className="text-gray-600">Process refunds and manage refund requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                  <p className="text-2xl font-bold text-gray-900">{refundTransactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {refundTransactions.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {refundTransactions.filter(r => r.status === 'COMPLETED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{refundTransactions
                      .filter(r => r.status === 'COMPLETED')
                      .reduce((sum, r) => sum + r.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refund Eligible Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Eligible Transactions</CardTitle>
            <CardDescription>Completed payments that can be refunded</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading transactions...</p>
              </div>
            ) : refundEligibleTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refundEligibleTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.description || 'Payment'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Ref: {transaction.reference || transaction.id.slice(0, 8)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.users?.name}</div>
                          <div className="text-sm text-gray-500">{transaction.users?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{transaction.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setRefundAmount(transaction.amount.toString());
                            }}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Process Refund
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No refund eligible transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Refunds */}
        <Card>
          <CardHeader>
            <CardTitle>Refund History</CardTitle>
            <CardDescription>All processed and pending refunds</CardDescription>
          </CardHeader>
          <CardContent>
            {refundTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Refund Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refundTransactions.map((refund) => (
                      <tr key={refund.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {refund.description || 'Refund'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(refund.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{refund.users?.name}</div>
                          <div className="text-sm text-gray-500">{refund.users?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{refund.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(refund.status)}`}>
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {refund.status === 'PENDING' && (
                            <>
                              <Button
                                onClick={() => updateRefundStatus(refund.id, 'COMPLETED')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={loading}
                              >
                                Complete
                              </Button>
                              <Button
                                onClick={() => updateRefundStatus(refund.id, 'FAILED')}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                disabled={loading}
                              >
                                Mark Failed
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No refunds processed yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Process Refund Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Process Refund</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-900">Transaction Details</h3>
              <p className="text-sm text-gray-600">User: {selectedTransaction.users?.name}</p>
              <p className="text-sm text-gray-600">Original Amount: ₹{selectedTransaction.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Date: {new Date(selectedTransaction.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter refund amount"
                  max={selectedTransaction.amount}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Reason
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter reason for refund..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setSelectedTransaction(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRefund(selectedTransaction.id)}
                disabled={loading || !refundAmount || !refundReason}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Processing...' : 'Process Refund'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
