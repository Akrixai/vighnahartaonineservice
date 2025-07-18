import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch comprehensive analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get revenue data from applications
    const { data: revenueData } = await supabaseAdmin
      .from('applications')
      .select('amount, created_at, commission_amount, commission_paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['APPROVED', 'COMPLETED']);

    // Calculate revenue metrics
    const totalRevenue = revenueData?.reduce((sum, app) => sum + (app.amount || 0), 0) || 0;
    const todayRevenue = revenueData?.filter(app =>
      new Date(app.created_at).toDateString() === new Date().toDateString()
    ).reduce((sum, app) => sum + (app.amount || 0), 0) || 0;

    const thisMonthRevenue = revenueData?.filter(app => {
      const appDate = new Date(app.created_at);
      const now = new Date();
      return appDate.getMonth() === now.getMonth() &&
             appDate.getFullYear() === now.getFullYear();
    }).reduce((sum, app) => sum + (app.amount || 0), 0) || 0;

    // Get commission data from transactions
    const { data: commissionData } = await supabaseAdmin
      .from('transactions')
      .select('amount, created_at')
      .eq('type', 'COMMISSION')
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalCommissionPaid = commissionData?.reduce((sum, transaction) =>
      sum + parseFloat(transaction.amount.toString()), 0) || 0;

    const todayCommission = commissionData?.filter(transaction =>
      new Date(transaction.created_at).toDateString() === new Date().toDateString()
    ).reduce((sum, transaction) => sum + parseFloat(transaction.amount.toString()), 0) || 0;

    const thisMonthCommission = commissionData?.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() &&
             transactionDate.getFullYear() === now.getFullYear();
    }).reduce((sum, transaction) => sum + parseFloat(transaction.amount.toString()), 0) || 0;

    // Calculate profit (revenue minus commission)
    const totalProfit = totalRevenue - totalCommissionPaid;
    const todayProfit = todayRevenue - todayCommission;
    const thisMonthProfit = thisMonthRevenue - thisMonthCommission;

    // Group revenue and commission by date
    const dailyRevenue: { [key: string]: number } = {};
    const dailyCommission: { [key: string]: number } = {};
    const dailyProfit: { [key: string]: number } = {};

    revenueData?.forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (app.amount || 0);
    });

    commissionData?.forEach(transaction => {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      const amount = parseFloat(transaction.amount.toString());
      dailyCommission[date] = (dailyCommission[date] || 0) + amount;
    });

    // Calculate daily profit
    Object.keys(dailyRevenue).forEach(date => {
      const revenue = dailyRevenue[date] || 0;
      const commission = dailyCommission[date] || 0;
      dailyProfit[date] = revenue - commission;
    });

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('role, created_at');

    const totalUsers = allUsers?.length || 0;
    const retailers = allUsers?.filter(user => user.role === UserRole.RETAILER).length || 0;
    const employees = allUsers?.filter(user => user.role === UserRole.EMPLOYEE).length || 0;
    
    const newToday = userData?.filter(user => 
      new Date(user.created_at).toDateString() === new Date().toDateString()
    ).length || 0;

    // Group users by date
    const dailyUsers: { [key: string]: number } = {};
    userData?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      dailyUsers[date] = (dailyUsers[date] || 0) + 1;
    });

    // Get forms data
    const { data: formsData } = await supabaseAdmin
      .from('applications')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalForms = formsData?.length || 0;
    const todayForms = formsData?.filter(form =>
      new Date(form.created_at).toDateString() === new Date().toDateString()
    ).length || 0;

    const thisMonthForms = formsData?.filter(form => {
      const formDate = new Date(form.created_at);
      const now = new Date();
      return formDate.getMonth() === now.getMonth() &&
             formDate.getFullYear() === now.getFullYear();
    }).length || 0;

    const completedForms = formsData?.filter(form =>
      form.status === 'COMPLETED' || form.status === 'APPROVED'
    ).length || 0;
    const completionRate = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0;

    // Group forms by date
    const dailyForms: { [key: string]: number } = {};
    formsData?.forEach(form => {
      const date = new Date(form.created_at).toISOString().split('T')[0];
      dailyForms[date] = (dailyForms[date] || 0) + 1;
    });

    // Get services data
    const { data: servicesData } = await supabaseAdmin
      .from('schemes')
      .select('is_active, is_free');

    const totalServices = servicesData?.length || 0;
    const activeServices = servicesData?.filter(service => service.is_active).length || 0;
    const freeServices = servicesData?.filter(service => service.is_free && service.is_active).length || 0;

    // Get certificates data
    const { data: employeeCerts } = await supabaseAdmin
      .from('employee_certificates')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: retailerCerts } = await supabaseAdmin
      .from('retailer_certificates')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: allEmployeeCerts } = await supabaseAdmin
      .from('employee_certificates')
      .select('id');

    const { data: allRetailerCerts } = await supabaseAdmin
      .from('retailer_certificates')
      .select('id');

    const totalCertificates = (allEmployeeCerts?.length || 0) + (allRetailerCerts?.length || 0);
    const todayCertificates = (employeeCerts?.filter(cert => 
      new Date(cert.created_at).toDateString() === new Date().toDateString()
    ).length || 0) + (retailerCerts?.filter(cert => 
      new Date(cert.created_at).toDateString() === new Date().toDateString()
    ).length || 0);

    // Get branches data
    const { data: branchesData } = await supabaseAdmin
      .from('branches')
      .select('is_active');

    const totalBranches = branchesData?.length || 0;
    const activeBranches = branchesData?.filter(branch => branch.is_active).length || 0;

    // Format data for charts
    const formatChartData = (data: { [key: string]: number }) => {
      return Object.entries(data)
        .map(([date, value]) => ({ date, amount: value, count: value }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const analytics = {
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisMonth: thisMonthRevenue,
        dailyRevenue: formatChartData(dailyRevenue)
      },
      profit: {
        total: totalProfit,
        today: todayProfit,
        thisMonth: thisMonthProfit,
        dailyProfit: formatChartData(dailyProfit)
      },
      commission: {
        total: totalCommissionPaid,
        today: todayCommission,
        thisMonth: thisMonthCommission,
        dailyCommission: formatChartData(dailyCommission)
      },
      users: {
        total: totalUsers,
        retailers,
        employees,
        newToday,
        newThisMonth: userData?.length || 0,
        userGrowth: formatChartData(dailyUsers)
      },
      forms: {
        totalSubmitted: totalForms,
        todaySubmitted: todayForms,
        thisMonthSubmitted: thisMonthForms,
        completionRate,
        dailyForms: formatChartData(dailyForms)
      },
      services: {
        totalServices,
        activeServices,
        freeServices,
        popularServices: [] // Can be enhanced with actual service usage data
      },
      certificates: {
        totalGenerated: totalCertificates,
        employeeCertificates: allEmployeeCerts?.length || 0,
        retailerCertificates: allRetailerCerts?.length || 0,
        todayGenerated: todayCertificates
      },
      branches: {
        totalBranches,
        activeBranches,
        branchPerformance: [] // Can be enhanced with branch-specific data
      }
    };

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error in GET /api/admin/analytics:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
