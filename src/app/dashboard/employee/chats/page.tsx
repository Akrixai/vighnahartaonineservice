'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { MessageCircle, Clock, User, Calendar, Bell } from 'lucide-react';

interface Chat {
  id: string;
  retailer_id: string;
  employee_id?: string;
  status: string;
  subject?: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
  users: {
    name: string;
    email: string;
    phone?: string;
  };
}

export default function EmployeeChatsPage() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningChat, setAssigningChat] = useState<string | null>(null);

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

  useEffect(() => {
    fetchChats();
    
    // Poll for new chats every 5 seconds for real-time updates
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/admin/chats');
      const result = await response.json();

      if (result.success) {
        setChats(result.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignChatToMe = async (chatId: string) => {
    setAssigningChat(chatId);
    try {
      const response = await fetch('/api/admin/chats/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          employee_id: session.user.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to chat interface
        window.location.href = `/dashboard/employee/chat/${chatId}`;
      } else {
        throw new Error(result.error || 'Failed to assign chat');
      }
    } catch (error) {
      console.error('Error assigning chat:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign chat');
    } finally {
      setAssigningChat(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-300';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING': return <Clock className="w-4 h-4" />;
      case 'ACTIVE': return <MessageCircle className="w-4 h-4" />;
      case 'RESOLVED': return <MessageCircle className="w-4 h-4" />;
      case 'CLOSED': return <MessageCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const waitingChats = chats.filter(chat => chat.status === 'WAITING');
  const myActiveChats = chats.filter(chat => chat.status === 'ACTIVE' && chat.employee_id === session.user.id);
  const allActiveChats = chats.filter(chat => chat.status === 'ACTIVE');
  const resolvedChats = chats.filter(chat => chat.status === 'RESOLVED');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">💬 Customer Support Chats</h1>
          <p className="text-red-100">Manage retailer support requests in real-time</p>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" />
              <span>{waitingChats.length} New Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-400" />
              <span>{myActiveChats.length} My Active Chats</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>{resolvedChats.length} Resolved Today</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chats...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* New Chat Requests */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  New Chat Requests ({waitingChats.length})
                </CardTitle>
                <CardDescription>Retailers waiting for support</CardDescription>
              </CardHeader>
              <CardContent>
                {waitingChats.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No new chat requests</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {waitingChats.map((chat) => (
                      <div key={chat.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{chat.users.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(chat.status)}`}>
                            {getStatusIcon(chat.status)}
                            <span className="ml-1">{chat.status}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{chat.users.email}</p>
                        {chat.users.phone && (
                          <p className="text-sm text-gray-600 mb-3">{chat.users.phone}</p>
                        )}
                        
                        {chat.last_message && (
                          <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mb-3 line-clamp-2">
                            "{chat.last_message}"
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(chat.created_at).toLocaleString()}</span>
                        </div>
                        
                        <Button
                          onClick={() => assignChatToMe(chat.id)}
                          disabled={assigningChat === chat.id}
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {assigningChat === chat.id ? 'Taking Chat...' : 'Take This Chat'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Active Chats */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  My Active Chats ({myActiveChats.length})
                </CardTitle>
                <CardDescription>Chats currently assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {myActiveChats.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active chats assigned to you</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myActiveChats.map((chat) => (
                      <div key={chat.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{chat.users.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(chat.status)}`}>
                            {getStatusIcon(chat.status)}
                            <span className="ml-1">{chat.status}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{chat.users.email}</p>
                        
                        {chat.last_message && (
                          <div className="bg-blue-50 p-2 rounded text-sm text-gray-700 mb-3 line-clamp-2">
                            "{chat.last_message}"
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <Calendar className="w-3 h-3" />
                          <span>Updated: {new Date(chat.updated_at).toLocaleString()}</span>
                        </div>
                        
                        <Button
                          onClick={() => window.location.href = `/dashboard/employee/chat/${chat.id}`}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          Continue Chat
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{waitingChats.length}</div>
                  <div className="text-sm text-gray-600">Waiting</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{myActiveChats.length}</div>
                  <div className="text-sm text-gray-600">My Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{allActiveChats.length}</div>
                  <div className="text-sm text-gray-600">Total Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-600 mb-2">{chats.length}</div>
                  <div className="text-sm text-gray-600">Total Chats</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
