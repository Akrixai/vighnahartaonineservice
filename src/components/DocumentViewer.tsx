'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';

interface DocumentViewerProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Document {
  id: string;
  document_type: string;
  description: string;
  status: string;
  created_at: string;
  viewUrl: string;
  users: {
    name: string;
    email: string;
  };
}

export default function DocumentViewer({ documentId, isOpen, onClose }: DocumentViewerProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId && isOpen) {
      fetchDocument();
    }
  }, [documentId, isOpen]);

  const fetchDocument = async () => {
    if (!documentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/view`);
      const result = await response.json();

      if (result.success) {
        let documentData = result.document;

        // Use the public_url from the API response
        documentData.viewUrl = documentData.public_url || documentData.file_url;

        setDocument(documentData);
      } else {
        setError(result.error || 'Failed to load document');
      }
    } catch (error) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (document?.viewUrl) {
      const link = document.createElement('a');
      link.href = document.viewUrl;
      link.download = `${document.document_type}_${document.id}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (document?.viewUrl) {
      window.open(document.viewUrl, '_blank');
    }
  };

  const isPDF = (url: string) => {
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {document ? `${document.document_type} - Document Viewer` : 'Document Viewer'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {document && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-gray-600">
                <p><strong>Submitted by:</strong> {document.users.name} ({document.users.email})</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    document.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    document.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {document.status}
                  </span>
                </p>
                {document.description && (
                  <p><strong>Description:</strong> {document.description}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Document</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchDocument} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : document ? (
            <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
              {isPDF(document.viewUrl) ? (
                <iframe
                  src={document.viewUrl}
                  className="w-full h-full border-0"
                  title={`${document.document_type} Document`}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Document Preview Not Available</h3>
                    <p className="text-gray-600 mb-4">
                      This document type cannot be previewed in the browser.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleDownload} className="bg-red-600 hover:bg-red-700">
                        <Download className="h-4 w-4 mr-2" />
                        Download Document
                      </Button>
                      <Button onClick={handleOpenInNewTab} variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
