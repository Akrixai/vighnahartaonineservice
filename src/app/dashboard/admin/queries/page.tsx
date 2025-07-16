'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Query {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  type: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: string;
  response: string | null;
  created_at: string;
  updated_at: string;
  responded_by: string | null;
  responded_at: string | null;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function QueriesManagementPage() {
  const { data: session } = useSession();
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: queries, loading: queriesLoading, refresh } = useRealTimeData<Query>({
    table: 'queries',
    orderBy: { column: 'created_at', ascending: false },
    select: `
      *,
      users (
        id,
        name,
        email
      )
    `,
    enabled: session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.EMPLOYEE
  });

  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (queryId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/queries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: queryId,
          status: newStatus,
          responded_by: session?.user?.id,
          responded_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update query status');
      }

      refresh();
    } catch (error) {
      console.error('Error updating query status:', error);
      showToast.error('Failed to update query status', {
        description: 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (queryId: string) => {
    if (!responseText.trim()) {
      showToast.error('Response required', {
        description: 'Please enter a response'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/queries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: queryId,
          response: responseText,
          status: 'RESOLVED',
          responded_by: session?.user?.id,
          responded_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send response');
      }

      setResponseText('');
      setSelectedQuery(null);
      refresh();
    } catch (error) {
      console.error('Error sending response:', error);
      showToast.error('Failed to send response', {
        description: 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Query Management</h1>
            <p className="text-gray-600">Manage customer queries and support tickets</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold text-gray-900">{queries?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {queries?.filter(q => q.status === 'OPEN').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {queries?.filter(q => q.status === 'IN_PROGRESS').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {queries?.filter(q => q.status === 'RESOLVED').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queries List */}
        <Card>
          <CardHeader>
            <CardTitle>All Queries</CardTitle>
            <CardDescription>View and manage customer support queries</CardDescription>
          </CardHeader>
          <CardContent>
            {queriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading queries...</p>
              </div>
            ) : queries && queries.length > 0 ? (
              <div className="space-y-4">
                {queries.map((query) => (
                  <div key={query.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{query.subject}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {query.users?.name || 'Unknown User'}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(query.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                          {query.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                          {query.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{query.message}</p>
                    
                    {query.response && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                        <p className="text-sm font-medium text-green-800">Response:</p>
                        <p className="text-green-700">{query.response}</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {query.status === 'OPEN' && (
                        <Button
                          onClick={() => handleStatusUpdate(query.id, 'IN_PROGRESS')}
                          disabled={loading}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Start Working
                        </Button>
                      )}
                      
                      {query.status !== 'RESOLVED' && query.status !== 'CLOSED' && (
                        <Button
                          onClick={() => setSelectedQuery(query)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Respond
                        </Button>
                      )}
                      
                      {query.status === 'RESOLVED' && (
                        <Button
                          onClick={() => handleStatusUpdate(query.id, 'CLOSED')}
                          disabled={loading}
                          size="sm"
                          variant="outline"
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No queries found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold mb-4">Respond to Query</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-900">{selectedQuery.subject}</h3>
              <p className="text-gray-600 text-sm">From: {selectedQuery.users?.name}</p>
              <p className="text-gray-700 mt-2">{selectedQuery.message}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter your response..."
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setSelectedQuery(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleResponse(selectedQuery.id)}
                disabled={loading || !responseText.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Sending...' : 'Send Response'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
