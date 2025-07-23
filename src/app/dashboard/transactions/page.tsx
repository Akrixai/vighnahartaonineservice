'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';

export default function TransactionsPage() {
  const { data: session } = useSession();
  const { getTransactions } = useApi();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch transactions
  useEffect(() => {
    if (!session) return;

    const fetchTransactions = async () => {
      setLoading(true);
      const params: any = { 
        page: currentPage, 
        limit: 10 
      };
      
      if (filter !== 'ALL') {
        params.type = filter;
      }

      const response = await getTransactions(params);
      if (response?.success) {
        setTransactions(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [session, getTransactions, filter, currentPage]);

  if (!session) {
    return null; // Middleware will redirect
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-green-600 bg-green-100';
      case 'SCHEME_PAYMENT': return 'text-red-600 bg-red-100';
      case 'REFUND': return 'text-blue-600 bg-blue-100';
      case 'WITHDRAWAL': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return '💰';
      case 'SCHEME_PAYMENT': return '📝';
      case 'REFUND': return '↩️';
      case 'WITHDRAWAL': return '💸';
      default: return '💳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filterOptions = [
    { value: 'ALL', label: 'All Transactions' },
    { value: 'DEPOSIT', label: 'Deposits' },
    { value: 'SCHEME_PAYMENT', label: 'Service Payments' },
    { value: 'REFUND', label: 'Refunds' },
    { value: 'WITHDRAWAL', label: 'Withdrawals' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Transaction History</h1>
          <p className="text-blue-100">
            View all your wallet transactions and payment history.
          </p>
        </div>

        {/* Filter Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === option.value
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Total: {transactions.length} transactions
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">
                {filter !== 'ALL' 
                  ? `No ${filter.toLowerCase()} transactions found. Try changing the filter.`
                  : 'You haven\'t made any transactions yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {transaction.description || transaction.type.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(transaction.created_at)}
                        </p>
                        {transaction.reference && (
                          <p className="text-xs text-gray-400">
                            Ref: {transaction.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionColor(transaction.type)}`}>
                          {transaction.type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Transaction Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-medium text-blue-900 mb-1">Track Everything</h4>
                <p className="text-blue-700">Monitor all your wallet activities and payments</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-blue-900 mb-1">Filter & Search</h4>
                <p className="text-blue-700">Use filters to find specific transaction types</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">💳</div>
                <h4 className="font-medium text-blue-900 mb-1">Secure Records</h4>
                <p className="text-blue-700">All transactions are securely recorded and verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
