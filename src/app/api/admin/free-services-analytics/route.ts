import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch free services analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get total accesses in the date range
    const { data: totalAccessesData, error: totalError } = await supabaseAdmin
      .from('free_service_usage')
      .select('id')
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString());

    if (totalError) {
      console.error('Error fetching total accesses:', totalError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get unique users count
    const { data: uniqueUsersData, error: usersError } = await supabaseAdmin
      .from('free_service_usage')
      .select('user_id')
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString());

    if (usersError) {
      console.error('Error fetching unique users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const uniqueUsers = new Set(uniqueUsersData?.map(u => u.user_id) || []).size;

    // Get top services
    const { data: topServicesData, error: topServicesError } = await supabaseAdmin
      .rpc('get_top_free_services', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit_count: 10
      });

    if (topServicesError) {
      console.error('Error fetching top services:', topServicesError);
      // Create fallback query if RPC doesn't exist
      const { data: fallbackTopServices } = await supabaseAdmin
        .from('free_service_usage')
        .select('service_name, external_url')
        .gte('accessed_at', startDate.toISOString())
        .lte('accessed_at', endDate.toISOString());

      // Group by service and count
      const serviceGroups: { [key: string]: { service_name: string; external_url: string; access_count: number } } = {};
      fallbackTopServices?.forEach(usage => {
        const key = `${usage.service_name}-${usage.external_url}`;
        if (serviceGroups[key]) {
          serviceGroups[key].access_count++;
        } else {
          serviceGroups[key] = {
            service_name: usage.service_name,
            external_url: usage.external_url,
            access_count: 1
          };
        }
      });

      const topServices = Object.values(serviceGroups)
        .sort((a, b) => b.access_count - a.access_count)
        .slice(0, 10);

      // Get daily usage
      const { data: dailyUsageData } = await supabaseAdmin
        .from('free_service_usage')
        .select('accessed_at')
        .gte('accessed_at', startDate.toISOString())
        .lte('accessed_at', endDate.toISOString())
        .order('accessed_at');

      // Group by date
      const dailyGroups: { [key: string]: number } = {};
      dailyUsageData?.forEach(usage => {
        const date = new Date(usage.accessed_at).toISOString().split('T')[0];
        dailyGroups[date] = (dailyGroups[date] || 0) + 1;
      });

      const dailyUsage = Object.entries(dailyGroups).map(([date, count]) => ({
        date,
        access_count: count
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Get category stats by joining with schemes table
      const { data: categoryData } = await supabaseAdmin
        .from('free_service_usage')
        .select(`
          service_id,
          schemes!inner(category)
        `)
        .gte('accessed_at', startDate.toISOString())
        .lte('accessed_at', endDate.toISOString());

      const categoryGroups: { [key: string]: number } = {};
      categoryData?.forEach((usage: any) => {
        const category = usage.schemes?.category || 'Other';
        categoryGroups[category] = (categoryGroups[category] || 0) + 1;
      });

      const categoryStats = Object.entries(categoryGroups).map(([category, count]) => ({
        category,
        access_count: count
      })).sort((a, b) => b.access_count - a.access_count);

      return NextResponse.json({
        success: true,
        stats: {
          totalAccesses: totalAccessesData?.length || 0,
          uniqueUsers,
          topServices,
          dailyUsage,
          categoryStats
        }
      });
    }

    // If RPC exists, use the returned data
    const topServices = topServicesData || [];

    // Get daily usage
    const { data: dailyUsageData, error: dailyError } = await supabaseAdmin
      .rpc('get_daily_free_service_usage', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (dailyError) {
      console.error('Error fetching daily usage:', dailyError);
      // Fallback for daily usage
      const { data: fallbackDaily } = await supabaseAdmin
        .from('free_service_usage')
        .select('accessed_at')
        .gte('accessed_at', startDate.toISOString())
        .lte('accessed_at', endDate.toISOString());

      const dailyGroups: { [key: string]: number } = {};
      fallbackDaily?.forEach(usage => {
        const date = new Date(usage.accessed_at).toISOString().split('T')[0];
        dailyGroups[date] = (dailyGroups[date] || 0) + 1;
      });

      const dailyUsage = Object.entries(dailyGroups).map(([date, count]) => ({
        date,
        access_count: count
      })).sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({
        success: true,
        stats: {
          totalAccesses: totalAccessesData?.length || 0,
          uniqueUsers,
          topServices,
          dailyUsage,
          categoryStats: []
        }
      });
    }

    // Get category stats
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .rpc('get_free_service_category_stats', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (categoryError) {
      console.error('Error fetching category stats:', categoryError);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalAccesses: totalAccessesData?.length || 0,
        uniqueUsers,
        topServices,
        dailyUsage: dailyUsageData || [],
        categoryStats: categoryData || []
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/free-services-analytics:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
