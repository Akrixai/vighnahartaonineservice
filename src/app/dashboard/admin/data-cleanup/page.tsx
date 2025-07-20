'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Database, AlertTriangle, CheckCircle, Clock, FileText, Bell, MessageSquare, Calendar, Settings } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/layout';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

interface DataStats {
  applications: number;
  notifications: number;
  queries: number;
  transactions: number;
  login_advertisements: number;
  advertisements: number;
  documents: number;
}

interface CleanupTask {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  dataType: keyof DataStats;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedSpace: string;
  lastCleanup?: string;
  defaultDays: number;
  minDays: number;
  maxDays: number;
  timeUnit: 'days' | 'months' | 'years';
}

const cleanupTasks: CleanupTask[] = [
  {
    id: 'old-applications',
    name: 'Old Applications',
    description: 'Remove applications with status REJECTED or COMPLETED',
    icon: <FileText className="w-5 h-5" />,
    dataType: 'applications',
    riskLevel: 'low',
    estimatedSpace: '~50MB',
    defaultDays: 180,
    minDays: 1, // Minimum 1 day
    maxDays: 365,
    timeUnit: 'days'
  },
  {
    id: 'notifications',
    name: 'Old Notifications',
    description: 'Remove old notifications to free up space',
    icon: <Bell className="w-5 h-5" />,
    dataType: 'notifications',
    riskLevel: 'low',
    estimatedSpace: '~10MB',
    defaultDays: 30,
    minDays: 1, // Minimum 1 day
    maxDays: 90,
    timeUnit: 'days'
  },
  {
    id: 'resolved-queries',
    name: 'Resolved Support Queries',
    description: 'Remove support queries that are resolved',
    icon: <MessageSquare className="w-5 h-5" />,
    dataType: 'queries',
    riskLevel: 'low',
    estimatedSpace: '~20MB',
    defaultDays: 90,
    minDays: 1, // Minimum 1 day
    maxDays: 180,
    timeUnit: 'days'
  },
  {
    id: 'old-transactions',
    name: 'Old Transaction Logs',
    description: 'Archive old transaction logs (keeps financial records)',
    icon: <Database className="w-5 h-5" />,
    dataType: 'transactions',
    riskLevel: 'medium',
    estimatedSpace: '~100MB',
    defaultDays: 365,
    minDays: 1, // Minimum 1 day
    maxDays: 1095,
    timeUnit: 'days'
  },
  {
    id: 'old-documents',
    name: 'Old Documents',
    description: 'Remove old document records (files remain in storage)',
    icon: <FileText className="w-5 h-5" />,
    dataType: 'documents',
    riskLevel: 'medium',
    estimatedSpace: '~20MB',
    defaultDays: 90,
    minDays: 1,
    maxDays: 365,
    timeUnit: 'days'
  },
  {
    id: 'inactive-users',
    name: 'Inactive Users',
    description: 'Remove inactive retailer accounts (minimum 30 days)',
    icon: <Settings className="w-5 h-5" />,
    dataType: 'applications', // Using applications as proxy for user activity
    riskLevel: 'high',
    estimatedSpace: '~5MB',
    defaultDays: 365,
    minDays: 30, // Minimum 30 days for user deletion
    maxDays: 1095,
    timeUnit: 'days'
  }
];

export default function DataCleanupPage() {
  const { data: session } = useSession();
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState<string | null>(null);
  const [customDays, setCustomDays] = useState<Record<string, number>>({});
  const [showCustomSettings, setShowCustomSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDataStats();

    // Set up real-time subscriptions for data changes
    const channels = [
      supabase
        .channel('data-cleanup-applications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
          console.log('Applications changed, refreshing stats...');
          fetchDataStats();
        })
        .subscribe(),

      supabase
        .channel('data-cleanup-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          console.log('Notifications changed, refreshing stats...');
          fetchDataStats();
        })
        .subscribe(),

      supabase
        .channel('data-cleanup-transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
          console.log('Transactions changed, refreshing stats...');
          fetchDataStats();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const fetchDataStats = async () => {
    try {
      const response = await fetch('/api/admin/data-stats');
      if (response.ok) {
        const stats = await response.json();
        setDataStats(stats);
      }
    } catch (error) {
      console.error('Error fetching data stats:', error);
      showToast.error('Failed to load data statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async (taskId: string) => {
    const task = cleanupTasks.find(t => t.id === taskId);
    if (!task) return;

    const daysToDelete = customDays[taskId] || task.defaultDays;
    const confirmed = window.confirm(
      `Are you sure you want to clean up ${task.name}?\n\n${task.description}\n\nData older than ${daysToDelete} days will be deleted.\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setCleanupLoading(taskId);
    try {
      const response = await fetch('/api/admin/data-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: taskId, customDays: daysToDelete }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast.success(`${task.name} cleaned up successfully!`, {
          description: `Removed ${result.deletedCount} records, freed ${result.spaceFreed}`
        });
        await fetchDataStats(); // Refresh stats immediately for real-time update

        // Trigger a global refresh for other components that might be affected
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dataCleanupCompleted', {
            detail: { taskId, deletedCount: result.deletedCount }
          }));
        }
      } else {
        showToast.error(`Failed to clean up ${task.name}`, {
          description: result.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      showToast.error(`Error cleaning up ${task.name}`);
    } finally {
      setCleanupLoading(null);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access data cleanup tools.</p>
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
            <Database className="w-10 h-10 mr-3" />
            Database Cleanup
          </h1>
          <p className="text-red-100 text-xl">
            Manage database storage by cleaning up old and unnecessary data
          </p>
          <div className="mt-4 flex items-center gap-4 text-red-100">
            <span>🗄️ Free up storage space</span>
            <span>•</span>
            <span>⚡ Improve performance</span>
            <span>•</span>
            <span>🔒 Preserve important data</span>
          </div>
        </div>

        {/* Warning Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
                <p className="text-yellow-700 mb-3">
                  Data cleanup operations are permanent and cannot be undone. The following data types will NEVER be deleted:
                </p>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li><strong>Users</strong> - All user accounts and profiles</li>
                  <li><strong>Certificates</strong> - All issued certificates and documents</li>
                  <li><strong>Services/Schemes</strong> - Service definitions and configurations</li>
                  <li><strong>Active Applications</strong> - Pending or recently processed applications</li>
                  <li><strong>Financial Records</strong> - Wallet balances and recent transactions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Statistics */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading database statistics...</p>
            </CardContent>
          </Card>
        ) : dataStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Database className="w-5 h-5 mr-2" />
                Current Database Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(dataStats).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{value.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cleanup Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cleanupTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      {task.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{task.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                  </div>
                  <Badge className={getRiskColor(task.riskLevel)}>
                    {getRiskIcon(task.riskLevel)}
                    <span className="ml-1 capitalize">{task.riskLevel} Risk</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <div>Records: {dataStats?.[task.dataType]?.toLocaleString() || 'N/A'}</div>
                      <div>Est. Space: {task.estimatedSpace}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomSettings(prev => ({
                        ...prev,
                        [task.id]: !prev[task.id]
                      }))}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {showCustomSettings[task.id] ? 'Hide' : 'Settings'}
                    </Button>
                  </div>

                  {/* Custom Time Period Settings */}
                  {showCustomSettings[task.id] && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <Label htmlFor={`days-${task.id}`} className="text-sm font-medium text-gray-700">
                        Delete data older than (days):
                      </Label>
                      <div className="mt-2 flex items-center space-x-2">
                        <Input
                          id={`days-${task.id}`}
                          type="number"
                          min={task.minDays}
                          max={task.maxDays}
                          value={customDays[task.id] || task.defaultDays}
                          onChange={(e) => setCustomDays(prev => ({
                            ...prev,
                            [task.id]: parseInt(e.target.value) || task.defaultDays
                          }))}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">
                          (Min: {task.minDays}, Max: {task.maxDays}, Default: {task.defaultDays})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleCleanup(task.id)}
                      disabled={cleanupLoading === task.id || !dataStats?.[task.dataType]}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {cleanupLoading === task.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cleaning...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clean Up ({customDays[task.id] || task.defaultDays} days)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
