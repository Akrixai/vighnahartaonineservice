'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Image as ImageIcon,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Document {
  id?: string;
  url: string;
  name: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
}

interface DocumentListProps {
  documents: (string | Document)[];
  title?: string;
  showDownload?: boolean;
  className?: string;
}

export default function DocumentList({ 
  documents, 
  title = 'Documents',
  showDownload = true,
  className = ''
}: DocumentListProps) {
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  const normalizeDocument = (doc: string | Document): Document => {
    if (typeof doc === 'string') {
      return {
        url: doc,
        name: doc.split('/').pop() || 'Document',
        type: getFileTypeFromUrl(doc)
      };
    }
    return {
      ...doc,
      type: doc.type || getFileTypeFromUrl(doc.url)
    };
  };

  const getFileTypeFromUrl = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'doc':
      case 'docx':
        return 'document';
      default:
        return 'unknown';
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string> => {
    try {
      setLoadingUrls(prev => new Set(prev).add(filePath));
      
      const response = await fetch('/api/documents/get-signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: filePath,
          bucket: filePath.includes('image') ? 'images' : 'documents'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return result.signedUrl;
      } else {
        throw new Error(result.error || 'Failed to get signed URL');
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return filePath; // Fallback to original URL
    } finally {
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    }
  };

  const handleView = async (document: Document) => {
    try {
      let viewUrl = document.url;
      
      // If it's not a full URL, get signed URL
      if (!document.url.startsWith('http')) {
        viewUrl = await getSignedUrl(document.url);
      }
      
      window.open(viewUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      showToast.error('Failed to open document', {
        description: 'Please try again.'
      });
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      let downloadUrl = document.url;
      
      // If it's not a full URL, get signed URL
      if (!document.url.startsWith('http')) {
        downloadUrl = await getSignedUrl(document.url);
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = document.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast.error('Failed to download document', {
        description: 'Please try again.'
      });
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-blue-100 text-blue-800';
      case 'pdf':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No documents available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-600" />
          {title}
          <Badge variant="secondary" className="ml-2">
            {documents.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const document = normalizeDocument(doc);
            const isLoading = loadingUrls.has(document.url);
            
            return (
              <div
                key={document.id || index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(document.type)}
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {document.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getTypeColor(document.type)}`}
                      >
                        {document.type.toUpperCase()}
                      </Badge>
                      {document.size && (
                        <span className="text-xs text-gray-500">
                          {(document.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleView(document)}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {showDownload && (
                    <Button
                      onClick={() => handleDownload(document)}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
