'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/logo-spinner';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Calendar, 
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Award,
  Building
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    dailyRevenue: Array<{ date: string; amount: number }>;
  };
  profit: {
    total: number;
    today: number;
    thisMonth: number;
    dailyProfit: Array<{ date: string; amount: number }>;
  };
  users: {
    total: number;
    retailers: number;
    employees: number;
    newToday: number;
    newThisMonth: number;
    userGrowth: Array<{ date: string; count: number }>;
  };
  forms: {
    totalSubmitted: number;
    todaySubmitted: number;
    thisMonthSubmitted: number;
    completionRate: number;
    dailyForms: Array<{ date: string; count: number }>;
  };
  services: {
    totalServices: number;
    activeServices: number;
    freeServices: number;
    popularServices: Array<{ name: string; count: number }>;
  };
  certificates: {
    totalGenerated: number;
    employeeCertificates: number;
    retailerCertificates: number;
    todayGenerated: number;
  };
  branches: {
    totalBranches: number;
    activeBranches: number;
    branchPerformance: Array<{ branch: string; revenue: number; users: number }>;
  };
}

export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchAnalytics();
    }
  }, [session, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?days=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading analytics..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <BarChart3 className="w-10 h-10 mr-3" />
            Website Analytics Dashboard
          </h1>
          <p className="text-indigo-100 text-xl">
            Comprehensive insights into revenue, users, and platform performance
          </p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Time Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{analytics?.revenue.total.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Today: ₹{analytics?.revenue.today.toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics?.users.total.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    New today: {analytics?.users.newToday || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Forms Submitted</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics?.forms.totalSubmitted.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Today: {analytics?.forms.todaySubmitted || 0}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Profit</p>
                  <p className="text-3xl font-bold text-orange-600">
                    ₹{analytics?.profit.total.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Today: ₹{analytics?.profit.today.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue and Profit Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Daily Revenue Trend
              </CardTitle>
              <CardDescription>
                Revenue generated per day over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics?.revenue.dailyRevenue?.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">
                      {new Date(day.date).toLocaleDateString('en-GB', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                          style={{ 
                            width: `${analytics.revenue.total > 0 ? (day.amount / Math.max(...analytics.revenue.dailyRevenue.map(d => d.amount))) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-20 text-right">
                      ₹{day.amount.toLocaleString()}
                    </span>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No revenue data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Daily Profit Trend
              </CardTitle>
              <CardDescription>
                Profit generated per day over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics?.profit.dailyProfit?.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">
                      {new Date(day.date).toLocaleDateString('en-GB', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full"
                          style={{ 
                            width: `${analytics.profit.total > 0 ? (day.amount / Math.max(...analytics.profit.dailyProfit.map(d => d.amount))) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-20 text-right">
                      ₹{day.amount.toLocaleString()}
                    </span>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No profit data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Growth
              </CardTitle>
              <CardDescription>
                New user registrations over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics?.users.userGrowth?.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">
                      {new Date(day.date).toLocaleDateString('en-GB', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                          style={{ 
                            width: `${analytics.users.userGrowth.length > 0 ? (day.count / Math.max(...analytics.users.userGrowth.map(d => d.count))) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {day.count}
                    </span>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No user growth data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>
                Breakdown by user type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Retailers</span>
                  </div>
                  <span className="text-sm font-medium">
                    {analytics?.users.retailers || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Employees</span>
                  </div>
                  <span className="text-sm font-medium">
                    {analytics?.users.employees || 0}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analytics?.users.total || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Users</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Services</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {analytics?.services.activeServices || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Free: {analytics?.services.freeServices || 0}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Certificates</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {analytics?.certificates.totalGenerated || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Today: {analytics?.certificates.todayGenerated || 0}
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-pink-600">
                    {analytics?.forms.completionRate || 0}%
                  </p>
                  <p className="text-sm text-gray-500">Form completion</p>
                </div>
                <Target className="w-8 h-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Branches</p>
                  <p className="text-3xl font-bold text-teal-600">
                    {analytics?.branches.activeBranches || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total: {analytics?.branches.totalBranches || 0}
                  </p>
                </div>
                <Building className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
