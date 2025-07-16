'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Image } from 'lucide-react';

interface FileViewerProps {
  filePath: string;
  fileName?: string;
  className?: string;
  showDownload?: boolean;
  showPreview?: boolean;
}

export default function FileViewer({ 
  filePath, 
  fileName, 
  className = '',
  showDownload = true,
  showPreview = true
}: FileViewerProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function getFileUrl() {
      if (!filePath) {
        setError('No file path provided');
        setLoading(false);
        return;
      }

      try {
        // Use single documents bucket for all files
        const bucketName = 'documents';

        // Get public URL from Supabase storage
        const { data, error } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (error) {
          console.error('Error getting file URL:', error);
          setError(`Failed to get file URL: ${error.message}`);
        } else if (data?.publicUrl) {
          setUrl(data.publicUrl);
        } else {
          setError('Failed to generate public URL');
        }
      } catch (err) {
        console.error('Error in getFileUrl:', err);
        setError('Failed to load file');
      } finally {
        setLoading(false);
      }
    }

    getFileUrl();
  }, [filePath]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 border rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading file...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <FileText className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
        <FileText className="w-5 h-5 text-gray-500 mr-2" />
        <span className="text-sm text-gray-600">File not available</span>
      </div>
    );
  }

  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = url.match(/\.pdf$/i);
  const displayName = fileName || filePath.split('/').pop() || 'File';

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* File Header */}
      <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center">
          {isImage ? (
            <Image className="w-4 h-4 text-blue-500 mr-2" />
          ) : (
            <FileText className="w-4 h-4 text-red-500 mr-2" />
          )}
          <span className="text-sm font-medium text-gray-700 truncate">
            {displayName}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {showPreview && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(url, '_blank')}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
          )}
          
          {showDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = displayName;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* File Preview */}
      {showPreview && (
        <div className="p-4">
          {isImage ? (
            <div className="flex justify-center">
              <img 
                src={url} 
                alt={displayName}
                className="max-w-full max-h-64 object-contain rounded border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex items-center justify-center p-8 bg-gray-100 rounded">
                <span className="text-gray-500">Failed to load image</span>
              </div>
            </div>
          ) : isPdf ? (
            <div className="flex flex-col items-center space-y-3">
              <FileText className="w-16 h-16 text-red-500" />
              <p className="text-sm text-gray-600 text-center">
                PDF Document - Click "View" to open in new tab
              </p>
              <Button
                onClick={() => window.open(url, '_blank')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                Open PDF
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <FileText className="w-16 h-16 text-gray-500" />
              <p className="text-sm text-gray-600 text-center">
                Document file - Click "View" to open
              </p>
              <Button
                onClick={() => window.open(url, '_blank')}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Open File
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Utility component for displaying multiple files
interface FileListViewerProps {
  filePaths: string[];
  className?: string;
}

export function FileListViewer({ filePaths, className = '' }: FileListViewerProps) {
  if (!filePaths || filePaths.length === 0) {
    return (
      <div className={`text-center p-4 text-gray-500 ${className}`}>
        No files uploaded
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {filePaths.map((filePath, index) => (
        <FileViewer
          key={index}
          filePath={filePath}
          className="w-full"
          showPreview={false}
        />
      ))}
    </div>
  );
}

// Compact file viewer for lists
interface CompactFileViewerProps {
  filePath: string;
  fileName?: string;
}

export function CompactFileViewer({ filePath, fileName }: CompactFileViewerProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getFileUrl() {
      if (!filePath) {
        setLoading(false);
        return;
      }

      try {
        const bucketName = 'documents';

        const { data } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          setUrl(data.publicUrl);
        }
      } catch (err) {
        console.error('Error getting file URL:', err);
      } finally {
        setLoading(false);
      }
    }

    getFileUrl();
  }, [filePath]);

  if (loading) {
    return <span className="text-xs text-gray-500">Loading...</span>;
  }

  if (!url) {
    return <span className="text-xs text-red-500">File not available</span>;
  }

  const displayName = fileName || filePath.split('/').pop() || 'File';
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
    >
      {isImage ? (
        <Image className="w-3 h-3 mr-1" />
      ) : (
        <FileText className="w-3 h-3 mr-1" />
      )}
      {displayName}
    </a>
  );
}
