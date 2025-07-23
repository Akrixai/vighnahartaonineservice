'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/logo-spinner';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

interface CommissionTransaction {
  id: string;
  amount: number;
  description: string;
  reference: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  processed_by?: string;
}

interface CommissionData {
  transactions: CommissionTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalCommissionEarned: number;
    totalTransactions: number;
  };
}

export default function CommissionPage() {
  const { data: session, status } = useSession();
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCommissionData = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/commission?page=${page}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setCommissionData(data.data);
      } else {
        showToast.error('Failed to fetch commission data');
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
      showToast.error('Error loading commission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === UserRole.RETAILER) {
      fetchCommissionData(currentPage);

      // Set up real-time subscription for commission transactions
      const channel = supabase
        .channel('commission-transactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Commission transaction changed:', payload);
            }
            if (payload.new?.type === 'COMMISSION') {
              fetchCommissionData(currentPage);
              showToast.success('New commission received!');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, currentPage]);

  if (status === 'loading' || loading) {
    return <PageLoader />;
  }

  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. This page is only for retailers.</p>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Commission Earnings</h1>
          <p className="text-red-100">Track your commission earnings from approved applications</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Commission Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(commissionData?.summary.totalCommissionEarned || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {commissionData?.summary.totalTransactions || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  commissionData?.summary.totalTransactions 
                    ? (commissionData.summary.totalCommissionEarned / commissionData.summary.totalTransactions)
                    : 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>
              Your commission earnings from approved applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commissionData?.transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Commission Yet</h3>
                <p className="text-gray-600">
                  Start applying for services to earn commission when they get approved!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {commissionData?.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold">₹</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            Reference: {transaction.reference}
                          </p>
                          {transaction.metadata?.commission_rate && (
                            <p className="text-xs text-gray-500">
                              Commission Rate: {transaction.metadata.commission_rate}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {commissionData && commissionData.pagination.totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {currentPage} of {commissionData.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(commissionData.pagination.totalPages, prev + 1))}
                      disabled={currentPage === commissionData.pagination.totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
