'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types';
import { Send, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { showToast } from '@/lib/toast';
import TemporaryChatNotice from '@/components/TemporaryChatNotice';

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

interface Chat {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export default function HelpSupportPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing active chat on component mount
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadExistingChat = async () => {
      try {
        const response = await fetch('/api/admin/chats');
        const result = await response.json();

        if (result.success) {
          // Find active chat for this retailer
          const activeChat = result.chats?.find((c: any) =>
            c.retailer_id === session.user.id &&
            (c.status === 'ACTIVE' || c.status === 'WAITING')
          );

          if (activeChat) {
            setChat(activeChat);
            loadMessages(activeChat.id);
          }
        }
      } catch (error) {
        console.error('Error loading existing chat:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingChat();
  }, [session?.user?.id]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startChat = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello, I need help with my account.',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setChat({ 
          id: result.chat_id, 
          status: 'WAITING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        loadMessages(result.chat_id);
      } else {
        throw new Error(result.error || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      showToast.error('Failed to start chat', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat?chat_id=${chatId}`);
      const result = await response.json();

      if (result.success) {
        setMessages(result.messages || []);
        setChat(result.chat);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          chat_id: chat.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessages(prev => [...prev, result.message]);
        setNewMessage('');
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Poll for new messages every 2 seconds, but stop if chat is resolved
  useEffect(() => {
    if (!chat || chat.status === 'RESOLVED' || chat.status === 'CLOSED') return;

    const interval = setInterval(() => {
      loadMessages(chat.id);
    }, 2000); // More frequent updates for better real-time experience

    return () => clearInterval(interval);
  }, [chat]);

  // Hide chat when it's resolved
  useEffect(() => {
    if (chat && (chat.status === 'RESOLVED' || chat.status === 'CLOSED')) {
      // Wait 3 seconds then hide the chat
      const timeout = setTimeout(() => {
        setChat(null);
        setMessages([]);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [chat?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'text-yellow-600';
      case 'ACTIVE': return 'text-green-600';
      case 'RESOLVED': return 'text-blue-600';
      case 'CLOSED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING': return <Clock className="w-4 h-4" />;
      case 'ACTIVE': return <MessageCircle className="w-4 h-4" />;
      case 'RESOLVED': return <CheckCircle className="w-4 h-4" />;
      case 'CLOSED': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">💬 Help & Support</h1>
          <p className="text-red-100">Get help from our support team</p>
        </div>

        {/* Temporary Chat Notice */}
        <TemporaryChatNotice />

        {initialLoading ? (
          /* Loading State */
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking for existing chats...</p>
            </CardContent>
          </Card>
        ) : !chat ? (
          /* Start Chat Section */
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-gray-900">Need Help?</CardTitle>
              <CardDescription>Start a conversation with our support team</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-blue-50 p-6 rounded-lg">
                <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat Support</h3>
                <p className="text-gray-600 mb-4">
                  Connect with our support team for instant help with your account,
                  services, or any questions you may have.
                </p>
                <Button
                  onClick={startChat}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Starting Chat...' : 'Start Chat'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900">Quick Response</h4>
                  <p className="text-sm text-gray-600">Usually within 5 minutes</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900">Expert Help</h4>
                  <p className="text-sm text-gray-600">Trained support staff</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900">24/7 Available</h4>
                  <p className="text-sm text-gray-600">Round the clock support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Chat Interface */
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900">Support Chat</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className={getStatusColor(chat.status)}>
                      {getStatusIcon(chat.status)}
                    </span>
                    Status: {chat.status}
                    {chat.status === 'RESOLVED' && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Chat will close in 3 seconds
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="text-sm text-gray-500">
                  Chat ID: {chat.id.substring(0, 8)}...
                </div>
              </div>

              {/* Resolved notification */}
              {chat.status === 'RESOLVED' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Chat Resolved</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your support request has been resolved. Thank you for contacting us!
                  </p>
                </div>
              )}
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === session.user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === session.user.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">
                        <div className="font-medium mb-1">
                          {message.sender_id === session.user.id ? 'You' : message.users.name}
                          <span className="text-xs opacity-75 ml-2">
                            ({message.sender_role})
                          </span>
                        </div>
                        <div>{message.message}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sending || chat.status === 'RESOLVED' || chat.status === 'CLOSED'}
                  className="flex-1 text-gray-900"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending || chat.status === 'RESOLVED' || chat.status === 'CLOSED'}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {(chat.status === 'RESOLVED' || chat.status === 'CLOSED') && (
                <p className="text-sm text-gray-500 mt-2">
                  This chat has been {chat.status.toLowerCase()}. Start a new chat if you need further assistance.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
