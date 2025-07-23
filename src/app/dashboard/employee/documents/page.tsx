'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { formatDateTime } from '@/lib/utils';
import DocumentViewer from '@/components/DocumentViewer';

export default function EmployeeDocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Check employee access
  if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only employees and admins can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

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

  const handleViewDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDocumentId(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      APPROVED: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Document Review</h1>
          <p className="text-red-100 text-xl">
            Review and verify retailer documents and certificates
          </p>
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Documents</CardTitle>
            <CardDescription>View documents by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  onClick={() => setFilter(status)}
                  className={filter === status ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {status === 'ALL' ? 'All Documents' : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Document Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {document.document_type || 'Document'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Submitted by: {document.users?.name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Email: {document.users?.email || 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(document.status)}
                        </div>
                      </div>

                      {document.description && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-700">Description:</span>
                          <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                        </div>
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
                      </div>

                      {document.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Review Notes:</span>
                          <p className="text-sm text-gray-600 mt-1">{document.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      {document.file_url && (
                        <Button
                          onClick={() => handleViewDocument(document.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          📄 View Document
                        </Button>
                      )}
                      
                      <div className="text-xs text-gray-500 text-center">
                        {document.reviewed_at && (
                          <p>Reviewed: {formatDateTime(document.reviewed_at).split(' ')[0]}</p>
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
