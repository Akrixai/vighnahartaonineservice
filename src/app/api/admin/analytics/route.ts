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

    // Get revenue data from service applications
    const { data: revenueData } = await supabaseAdmin
      .from('service_applications')
      .select('price, created_at, commission_rate')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('payment_status', 'completed');

    // Calculate revenue metrics
    const totalRevenue = revenueData?.reduce((sum, app) => sum + (app.price || 0), 0) || 0;
    const todayRevenue = revenueData?.filter(app => 
      new Date(app.created_at).toDateString() === new Date().toDateString()
    ).reduce((sum, app) => sum + (app.price || 0), 0) || 0;

    // Calculate profit (revenue minus commission)
    const totalProfit = revenueData?.reduce((sum, app) => {
      const commission = (app.price || 0) * ((app.commission_rate || 0) / 100);
      return sum + (app.price || 0) - commission;
    }, 0) || 0;

    const todayProfit = revenueData?.filter(app => 
      new Date(app.created_at).toDateString() === new Date().toDateString()
    ).reduce((sum, app) => {
      const commission = (app.price || 0) * ((app.commission_rate || 0) / 100);
      return sum + (app.price || 0) - commission;
    }, 0) || 0;

    // Group revenue by date
    const dailyRevenue: { [key: string]: number } = {};
    const dailyProfit: { [key: string]: number } = {};
    
    revenueData?.forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (app.price || 0);
      
      const commission = (app.price || 0) * ((app.commission_rate || 0) / 100);
      dailyProfit[date] = (dailyProfit[date] || 0) + (app.price || 0) - commission;
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
      .from('service_applications')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalForms = formsData?.length || 0;
    const todayForms = formsData?.filter(form => 
      new Date(form.created_at).toDateString() === new Date().toDateString()
    ).length || 0;

    const completedForms = formsData?.filter(form => form.status === 'completed').length || 0;
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
        thisMonth: totalRevenue, // For the selected period
        dailyRevenue: formatChartData(dailyRevenue)
      },
      profit: {
        total: totalProfit,
        today: todayProfit,
        thisMonth: totalProfit, // For the selected period
        dailyProfit: formatChartData(dailyProfit)
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
        thisMonthSubmitted: totalForms, // For the selected period
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
