'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useRealTimeAdminApplications } from '@/hooks/useRealTimeData';
import { FileText, Clock, CheckCircle, XCircle, Eye, Check, X, User, Calendar } from 'lucide-react';
import { showToast } from '@/lib/toast';


export default function AdminApplicationsPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Use real-time data hook for admin applications
  const { data: allApplications, loading, refresh } = useRealTimeAdminApplications(
    session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.EMPLOYEE
  );

  // Filter applications based on selected filter
  const applications = allApplications?.filter(app => {
    if (filter === 'ALL') return true;
    return app.status === filter;
  }) || [];

  // Check admin/employee access
  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators and employees can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = session.user.role === UserRole.ADMIN;

  const handleAction = async () => {
    if (!selectedApp || !actionType) return;

    try {
      let url: string;
      let method: string;
      let body: any = {};

      if (actionType === 'delete') {
        url = `/api/admin/applications/${selectedApp.id}`;
        method = 'DELETE';
      } else if (actionType === 'approve') {
        // Use the simple admin applications endpoint for approval (no wallet deduction)
        url = `/api/admin/applications/${selectedApp.id}`;
        method = 'PUT';
        body = {
          status: 'APPROVED',
          notes: notes.trim() || undefined
        };
      } else if (actionType === 'reject') {
        // Use the simple admin applications endpoint for rejection
        url = `/api/admin/applications/${selectedApp.id}`;
        method = 'PUT';
        body = {
          status: 'REJECTED',
          notes: notes.trim() || undefined,
          refund: true
        };
      }

      const response = await fetch(url, {
        method,
        headers: method !== 'DELETE' ? { 'Content-Type': 'application/json' } : {},
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });

      const result = await response.json();

      if (response.ok) {
        refresh(); // Use the refresh function from the hook
        setShowModal(false);
        setSelectedApp(null);
        setActionType(null);
        setNotes('');
        // Dispatch custom event to refresh wallet/transactions for retailer
        if (actionType === 'reject') {
          window.dispatchEvent(new Event('walletOrTransactionChanged'));
        }
        if (actionType === 'approve' && result.wallet_info) {
          showToast.success(`Application approved successfully! ₹${result.wallet_info.amount_deducted} deducted from wallet. Remaining balance: ₹${result.wallet_info.remaining_balance}`);
        } else {
          showToast.success(`Application ${actionType}d successfully!`);
        }
      } else {
        showToast.error(result.error || `Failed to ${actionType} application`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing application:`, error);
      showToast.error(`Error ${actionType}ing application`);
    }
  };

  const openActionModal = (app: any, action: 'approve' | 'reject' | 'delete') => {
    setSelectedApp(app);
    setActionType(action);
    setShowModal(true);
    setNotes('');
  };

  const handleViewDocuments = (application: any) => {
    const hasRegularDocs = application.documents && application.documents.length > 0;
    const hasDynamicDocs = application.dynamic_field_documents &&
      Object.keys(application.dynamic_field_documents).length > 0;

    if (hasRegularDocs || hasDynamicDocs) {
      setSelectedApp(application);
      setShowDocumentModal(true);
    } else {
      showToast.error('No documents found for this application');
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-600';
      case 'APPROVED': return 'bg-green-100 text-green-600';
      case 'REJECTED': return 'bg-red-100 text-red-600';
      case 'COMPLETED': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filterOptions = [
    { value: 'ALL', label: 'All Applications' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Application Management</h1>
          <p className="text-red-100 text-xl">
            {isAdmin ? 'View, approve, reject, and delete applications' : 'View and update application status'}
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
                    onClick={() => setFilter(option.value)}
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
                Total: {applications.length} applications
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
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {filter !== 'ALL' 
                  ? `No ${filter.toLowerCase()} applications found.`
                  : 'No applications have been submitted yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Application Details */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.scheme?.name || 'Unknown Service'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Application ID: {application.id.slice(0, 8)}...
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Customer Details</h4>
                          <p className="text-sm text-gray-900">{application.customer_name}</p>
                          {application.customer_phone && (
                            <p className="text-sm text-gray-600">{application.customer_phone}</p>
                          )}
                          {application.customer_email && (
                            <p className="text-sm text-gray-600">{application.customer_email}</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Submitted By</h4>
                          <p className="text-sm text-gray-900">{application.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{application.user?.email || ''}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium">{formatCurrency(application.amount || 0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2">{formatDateTime(application.created_at)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Documents:</span>
                          <span className="ml-2">
                            {(application.documents?.length || 0) +
                             (application.dynamic_field_documents ?
                               Object.keys(application.dynamic_field_documents).reduce((total, key) =>
                                 total + (application.dynamic_field_documents[key]?.length || 0), 0
                               ) : 0
                             )} files
                          </span>
                        </div>
                      </div>

                      {application.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600">{application.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      {application.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => openActionModal(application, 'approve')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✅ Approve
                          </Button>
                          <Button
                            onClick={() => openActionModal(application, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            ❌ Reject
                          </Button>
                        </>
                      )}
                      
                      {((application.documents && application.documents.length > 0) ||
                        (application.dynamic_field_documents && Object.keys(application.dynamic_field_documents).length > 0)) && (
                        <Button
                          onClick={() => handleViewDocuments(application)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          📄 View Documents
                        </Button>
                      )}

                      {isAdmin && (
                        <Button
                          onClick={() => openActionModal(application, 'delete')}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          🗑️ Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {showModal && selectedApp && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {actionType === 'delete' ? 'Delete Application' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Application`}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {actionType === 'delete' ? (
                  <>
                    <span className="text-red-600 font-semibold">⚠️ Warning:</span> Are you sure you want to permanently delete the application for "{selectedApp.scheme?.name}" by {selectedApp.customer_name}?
                    <br />
                    <span className="text-sm text-red-500 mt-2 block">This action cannot be undone and will remove all associated data.</span>
                  </>
                ) : (
                  <>Are you sure you want to {actionType} the application for "{selectedApp.scheme?.name}" by {selectedApp.customer_name}?</>
                )}
              </p>

              {actionType !== 'delete' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder={`Add notes for ${actionType}ing this application...`}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleAction}
                  className={`flex-1 ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {actionType === 'delete' ? 'Delete' : actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                </Button>
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedApp(null);
                    setActionType(null);
                    setNotes('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Document Modal */}
        {showDocumentModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Documents for {selectedApp.customer_name}
                </h3>
                <Button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedApp(null);
                  }}
                  variant="outline"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Application: {selectedApp.scheme?.name} •
                  {(selectedApp.documents?.length || 0) +
                   (selectedApp.dynamic_field_documents ?
                     Object.keys(selectedApp.dynamic_field_documents).reduce((total, key) =>
                       total + (selectedApp.dynamic_field_documents[key]?.length || 0), 0
                     ) : 0
                   )} documents
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regular Documents */}
                  {selectedApp.documents?.map((documentUrl: string, index: number) => (
                    <div key={`regular-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Document {index + 1}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {documentUrl.split('.').pop()?.toUpperCase() || 'FILE'}
                        </span>
                      </div>

                      {/* Preview for images */}
                      {documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <div className="mb-3">
                          <img
                            src={documentUrl}
                            alt={`Document ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => window.open(documentUrl, '_blank')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          👁️ View
                        </Button>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = documentUrl;
                            link.download = `document-${index + 1}`;
                            link.click();
                          }}
                          variant="outline"
                          className="flex-1 text-sm"
                        >
                          📥 Download
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Dynamic Field Documents */}
                  {selectedApp.dynamic_field_documents && Object.entries(selectedApp.dynamic_field_documents).map(([fieldId, fileUrls]) =>
                    fileUrls?.map((documentUrl: string, index: number) => {
                      // Find the field label from scheme dynamic_fields
                      const fieldLabel = selectedApp.scheme?.dynamic_fields?.find((field: any) => field.id === fieldId)?.label || fieldId;

                      return (
                        <div key={`dynamic-${fieldId}-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              {fieldLabel} (Dynamic Field)
                            </h4>
                            <span className="text-xs text-gray-500">
                              {documentUrl.split('.').pop()?.toUpperCase() || 'FILE'}
                            </span>
                          </div>

                          {/* Preview for images */}
                          {documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <div className="mb-3">
                              <img
                                src={documentUrl}
                                alt={`Dynamic Field ${fieldLabel}`}
                                className="w-full h-32 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={() => window.open(documentUrl, '_blank')}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            >
                              👁️ View
                            </Button>
                            <Button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = documentUrl;
                                link.download = `${fieldLabel}-${index + 1}`;
                                link.click();
                              }}
                              variant="outline"
                              className="flex-1 text-sm"
                            >
                              📥 Download
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Show missing dynamic fields */}
                  {selectedApp.scheme?.dynamic_fields?.filter((field: any) =>
                    ['file', 'image', 'pdf'].includes(field.type) &&
                    (!selectedApp.dynamic_field_documents || !selectedApp.dynamic_field_documents[field.id])
                  ).map((field: any) => (
                    <div key={`missing-${field.id}`} className="border rounded-lg p-4 bg-red-50 border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-red-800">
                          {field.label} (Missing Document)
                        </h4>
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          {field.required ? 'REQUIRED' : 'OPTIONAL'}
                        </span>
                      </div>
                      <p className="text-sm text-red-600">
                        This {field.type} field was not uploaded by the retailer.
                      </p>
                    </div>
                  ))}
                </div>

                {(!selectedApp.documents || selectedApp.documents.length === 0) &&
                 (!selectedApp.dynamic_field_documents || Object.keys(selectedApp.dynamic_field_documents).length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📄</div>
                    <p>No documents found for this application</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
