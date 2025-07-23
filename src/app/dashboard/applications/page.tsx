'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useRealTimeApplications } from '@/hooks/useRealTimeData';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { showToast } from '@/lib/toast';

export default function ApplicationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Always call hooks before any early returns
  const { data: applications, loading, error, refresh } = useRealTimeApplications(session?.user?.id, true);

  // Check retailer access
  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter applications based on search and filters
  const filteredApplications = applications.filter(app => {
    const matchesStatus = selectedStatus === 'ALL' || app.status === selectedStatus;
    const matchesSearch = searchTerm === '' ||
      app.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.schemes?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customer_phone?.includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  // Handle reapply for rejected applications only
  const handleReapply = (application: any) => {
    if (application.status !== 'REJECTED') {
      showToast.error('Only rejected applications can be reapplied');
      return;
    }

    // Store the reapply data in sessionStorage to prefill the form
    const reapplyData = {
      schemeId: application.scheme_id,
      isReapply: true,
      originalApplicationId: application.id,
      customerData: {
        name: application.customer_name,
        phone: application.customer_phone,
        email: application.customer_email,
        address: application.customer_address
      },
      formData: application.form_data,
      documents: application.documents,
      dynamicFieldDocuments: application.dynamic_field_documents
    };

    sessionStorage.setItem('reapplyData', JSON.stringify(reapplyData));

    // Navigate to the service application page
    router.push(`/dashboard/services/${application.scheme_id}/apply`);

    showToast.info('Redirecting to reapply form...', {
      description: 'Your previous data will be prefilled. No charges will apply.'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-600';
      case 'APPROVED': return 'bg-green-100 text-green-600';
      case 'REJECTED': return 'bg-red-100 text-red-600';
      case 'PROCESSING': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      case 'PROCESSING': return '🔄';
      default: return '📄';
    }
  };

  const statusOptions = ['ALL', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">My Applications</h1>
          <p className="text-red-100 text-xl">
            Track the status of your submitted service applications
          </p>
          <div className="mt-4 flex items-center gap-4 text-red-100">
            <span>📋 {applications.length} Total Applications</span>
            <span>•</span>
            <span>🎯 Real-time Status Updates</span>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Applications</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by customer name, service, or phone..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status === 'ALL' ? 'All Status' : status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={refresh}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Applications</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedStatus !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'You haven\'t submitted any applications yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Application Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.schemes?.name || application.service_name || 'Unknown Service'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Application ID: {application.id.slice(0, 8)}...
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)} {application.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Customer:</span>
                          <span className="ml-2 font-medium">{application.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 font-medium">{application.customer_phone}</span>
                        </div>
                        {application.customer_email && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Email:</span>
                            <span className="ml-2 font-medium">{application.customer_email}</span>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-gray-500">Address:</span>
                          <span className="ml-2">{application.customer_address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Service Details</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2">{application.schemes?.category || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium">
                            {application.amount === 0 ? 'FREE' : formatCurrency(application.amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2">{formatDateTime(application.created_at).split(' ')[0]}</span>
                        </div>
                        {application.processed_at && (
                          <div>
                            <span className="text-gray-500">Processed:</span>
                            <span className="ml-2">{formatDateTime(application.processed_at).split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Status Information</h4>
                      <div className="space-y-2">
                        <div className={`px-3 py-2 rounded-lg text-sm ${getStatusColor(application.status)}`}>
                          <div className="font-medium">
                            {getStatusIcon(application.status)} {application.status}
                            {application.notes && application.notes.includes('REAPPLICATION') && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                REAPPLICATION
                              </span>
                            )}
                          </div>
                          {application.status === 'PENDING' && (
                            <div className="text-xs mt-1">
                              {application.notes && application.notes.includes('REAPPLICATION')
                                ? 'Reapplication waiting for admin review'
                                : 'Waiting for admin review'
                              }
                            </div>
                          )}
                          {application.status === 'PROCESSING' && (
                            <div className="text-xs mt-1">Being processed by admin</div>
                          )}
                          {application.status === 'APPROVED' && (
                            <div className="text-xs mt-1">
                              {application.notes && application.notes.includes('REAPPLICATION')
                                ? 'Reapplication approved'
                                : 'Application approved'
                              }
                            </div>
                          )}
                          {application.status === 'REJECTED' && (
                            <div className="text-xs mt-1">
                              {application.notes && application.notes.includes('REAPPLICATION')
                                ? 'Reapplication rejected'
                                : 'Application rejected'
                              }
                            </div>
                          )}
                        </div>
                        
                        {application.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Admin Notes:</div>
                            <div className="text-sm text-gray-700">{application.notes}</div>
                          </div>
                        )}

                        {/* Reapply Button for Rejected Applications Only */}
                        {application.status === 'REJECTED' && (
                          <div className="mt-3">
                            <Button
                              onClick={() => handleReapply(application)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                            >
                              🔄 Reapply for Service
                            </Button>
                            <div className="text-xs text-gray-500 mt-1 text-center">
                              No additional charges will apply for reapplication
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{applications.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {applications.filter(app => app.status === 'PENDING').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {applications.filter(app => app.status === 'PROCESSING').length}
                </div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {applications.filter(app => app.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {applications.filter(app => app.status === 'REJECTED').length}
                </div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
