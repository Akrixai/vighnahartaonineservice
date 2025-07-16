'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { formatDateTime } from '@/lib/utils';
import DocumentViewer from '@/components/DocumentViewer';
import { showToast } from '@/lib/toast';

export default function AdminDocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/admin/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  // Check admin access
  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          notes
        })
      });

      if (response.ok) {
        await fetchDocuments();
        showToast.success(`Document ${action}d successfully!`);
      } else {
        showToast.error(`Failed to ${action} document`);
      }
    } catch (error) {
      console.error(`Error ${action}ing document:`, error);
      showToast.error(`Error ${action}ing document`);
    }
  };

  const handleViewDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDocumentId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-600';
      case 'APPROVED': return 'bg-green-100 text-green-600';
      case 'REJECTED': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      default: return '📄';
    }
  };

  const filterOptions = [
    { value: 'ALL', label: 'All Documents' },
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Document Approval</h1>
          <p className="text-red-100 text-xl">
            Review and approve retailer documents and certificates
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
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600">Total: {documents.length} documents</span>
                <Button
                  onClick={fetchDocuments}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600">
                {filter !== 'ALL' 
                  ? `No ${filter.toLowerCase()} documents found.`
                  : 'No documents have been submitted yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Document Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {document.document_type || 'Document'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Submitted by: {document.user?.name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Email: {document.user?.email || 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
                            {getStatusIcon(document.status)} {document.status}
                          </span>
                        </div>
                      </div>

                      {document.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {document.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Document ID:</span>
                          <span className="ml-2 font-medium">{document.id.slice(0, 8)}...</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2 font-medium">{formatDateTime(document.created_at).split(' ')[0]}</span>
                        </div>
                        {document.file_url && (
                          <div className="col-span-2">
                            <span className="text-gray-500">File:</span>
                            <a 
                              href={document.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 underline"
                            >
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Status Information</h4>
                      <div className="space-y-2">
                        <div className={`px-3 py-2 rounded-lg text-sm ${getStatusColor(document.status)}`}>
                          <div className="font-medium">
                            {getStatusIcon(document.status)} {document.status}
                          </div>
                          {document.status === 'PENDING' && (
                            <div className="text-xs mt-1">Awaiting admin review</div>
                          )}
                        </div>
                        
                        {document.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Admin Notes:</div>
                            <div className="text-sm text-gray-700">{document.notes}</div>
                          </div>
                        )}

                        {document.reviewed_at && (
                          <div className="text-xs text-gray-500">
                            Reviewed: {formatDateTime(document.reviewed_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      {document.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => {
                              showToast.prompt('Add approval notes', {
                                description: 'Add approval notes (optional):',
                                placeholder: 'Enter approval notes...',
                                onSubmit: (notes: string) => {
                                  handleDocumentAction(document.id, 'approve', notes || undefined);
                                },
                                onCancel: () => {
                                  handleDocumentAction(document.id, 'approve', undefined);
                                }
                              });
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✅ Approve
                          </Button>
                          <Button
                            onClick={() => {
                              showToast.prompt('Add rejection reason', {
                                description: 'Add rejection reason:',
                                placeholder: 'Enter rejection reason...',
                                onSubmit: (notes: string) => {
                                  if (notes) {
                                    handleDocumentAction(document.id, 'reject', notes);
                                  }
                                }
                              });
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            ❌ Reject
                          </Button>
                        </>
                      )}
                      
                      {document.file_url && (
                        <Button
                          onClick={() => handleViewDocument(document.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          📄 View Document
                        </Button>
                      )}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{documents.length}</div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {documents.filter(doc => doc.status === 'PENDING').length}
                </div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(doc => doc.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {documents.filter(doc => doc.status === 'REJECTED').length}
                </div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        documentId={selectedDocumentId}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
      />
    </DashboardLayout>
  );
}
