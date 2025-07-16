'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';
import AdvertisementCarousel from '@/components/AdvertisementCarousel';


const mockStats = {
  totalApplications: 12,
  pendingApplications: 3,
  approvedApplications: 8,
  rejectedApplications: 1
};

const mockRecentTransactions = [
  { id: '1', type: 'DEPOSIT', amount: 1000, description: 'Wallet top-up', createdAt: new Date('2024-01-15') },
  { id: '2', type: 'SCHEME_PAYMENT', amount: -250, description: '7/12 Extract Application', createdAt: new Date('2024-01-14') },
  { id: '3', type: 'DEPOSIT', amount: 500, description: 'Wallet top-up', createdAt: new Date('2024-01-13') },
];

const mockRecentApplications = [
  { id: '1', schemeName: '7/12 Extract', status: 'PENDING', amount: 250, createdAt: new Date('2024-01-14') },
  { id: '2', schemeName: 'Income Certificate', status: 'APPROVED', amount: 150, createdAt: new Date('2024-01-12') },
  { id: '3', schemeName: 'Caste Certificate', status: 'PENDING', amount: 100, createdAt: new Date('2024-01-10') },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { getDashboardStats } = useApi();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    if (!session) return;

    const fetchStats = async () => {
      setLoading(true);
      const response = await getDashboardStats();
      if (response?.success) {
        setStats(response.data);
      }
      setLoading(false);
    };

    fetchStats();
  }, [getDashboardStats, session]);

  if (!session) {
    return null; // Middleware will redirect
  }

  const user = session.user;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-green-600';
      case 'SCHEME_PAYMENT': return 'text-red-600';
      case 'REFUND': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl animate-fade-in border border-red-500">
          <h1 className="text-4xl font-bold mb-3 text-white animate-slide-in-left">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-red-100 text-xl animate-slide-in-right">
            {user.role === UserRole.ADMIN && "Manage the entire system, employees, retailers, and monitor all activities."}
            {user.role === UserRole.EMPLOYEE && "Process applications, verify documents, and assist retailers."}
            {user.role === UserRole.RETAILER && "Provide government services to customers and earn commissions."}
          </p>
        </div>

        {/* Advertisement Carousel */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <CardTitle className="text-white text-2xl font-bold flex items-center">
              📢 Featured Government Announcements
            </CardTitle>
            <CardDescription className="text-red-100 text-lg">
              Latest schemes, updates, and important notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-white rounded-xl shadow-inner p-4">
              <AdvertisementCarousel
                position="dashboard"
                height="h-96"
                className="rounded-xl shadow-lg"
                autoPlay={true}
                autoPlayInterval={4000}
                showControls={true}
                showIndicators={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-white to-red-50 shadow-xl hover-lift animate-scale-in border border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Wallet Balance</CardTitle>
              <span className="text-2xl animate-float">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(stats?.walletBalance || 0)}
              </div>
              <p className="text-xs text-red-500">
                Available for transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-orange-50 shadow-xl hover-lift animate-scale-in border border-orange-200" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Total Applications</CardTitle>
              <span className="text-2xl animate-float" style={{ animationDelay: '0.5s' }}>📋</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-orange-500">
                All time applications
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-yellow-50 shadow-xl hover-lift animate-scale-in border border-yellow-200" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Pending Applications</CardTitle>
              <span className="text-2xl animate-float" style={{ animationDelay: '1s' }}>⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.pendingApplications || 0}</div>
              <p className="text-xs text-yellow-500">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl hover-lift animate-scale-in border border-green-200" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Approved Applications</CardTitle>
              <span className="text-2xl animate-float" style={{ animationDelay: '1.5s' }}>✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.approvedApplications || 0}</div>
              <p className="text-xs text-green-500">
                Successfully processed
              </p>
            </CardContent>
          </Card>

          {/* Role-specific additional stats */}
          {user.role === UserRole.RETAILER && (
            <>
              <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl hover-lift animate-scale-in border border-blue-200" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Service Receipts</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2s' }}>📄</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats?.totalReceipts || 0}</div>
                  <p className="text-xs text-blue-500">
                    Downloaded receipts
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl hover-lift animate-scale-in border border-purple-200" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Pending Wallet Requests</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2.5s' }}>💳</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats?.pendingWalletRequests || 0}</div>
                  <p className="text-xs text-purple-500">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === UserRole.EMPLOYEE && (
            <>
              <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl hover-lift animate-scale-in border border-blue-200" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Processed Today</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2s' }}>⚡</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats?.processedToday || 0}</div>
                  <p className="text-xs text-blue-500">
                    Applications processed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl hover-lift animate-scale-in border border-purple-200" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Wallet Approvals</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2.5s' }}>💳</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats?.pendingWalletRequests || 0}</div>
                  <p className="text-xs text-purple-500">
                    Need approval
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === UserRole.ADMIN && (
            <>
              <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl hover-lift animate-scale-in border border-blue-200" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">System Health</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2s' }}>🔧</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">100%</div>
                  <p className="text-xs text-blue-500">
                    System uptime
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl hover-lift animate-scale-in border border-purple-200" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Pending Approvals</CardTitle>
                  <span className="text-2xl animate-float" style={{ animationDelay: '2.5s' }}>⏰</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{(stats?.pendingWalletRequests || 0) + (stats?.pendingTransactions || 0)}</div>
                  <p className="text-xs text-purple-500">
                    Wallet & Transactions
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Advertisement Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Featured Services</CardTitle>
            <CardDescription className="text-gray-600">Discover our popular government services</CardDescription>
          </CardHeader>
          <CardContent>
            <AdvertisementCarousel
              position="dashboard"
              height="h-64"
              className="rounded-lg"
              autoPlay={true}
              autoPlayInterval={4000}
              showControls={true}
              showIndicators={true}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Transactions</CardTitle>
              <CardDescription className="text-gray-600">Your latest wallet activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.recentTransactions || mockRecentTransactions).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(transaction.createdAt)}</p>
                    </div>
                    <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View All Transactions →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Applications</CardTitle>
              <CardDescription className="text-gray-600">Your latest service applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.recentApplications || mockRecentApplications).map((application: any) => (
                  <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{application.schemeName}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(application.createdAt)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(application.amount)}</span>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View All Applications →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


      </div>


    </DashboardLayout>
  );
}
