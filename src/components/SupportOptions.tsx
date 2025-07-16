'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Mail, Send, Phone, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SupportOptionsProps {
  className?: string;
}

export default function SupportOptions({ className }: SupportOptionsProps) {
  const { data: session } = useSession();
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWhatsAppSupport = () => {
    if (!session?.user) {
      toast.error('Please login to contact support');
      return;
    }

    const phoneNumber = '919819399470'; // Admin WhatsApp number
    const message = `🙏 नमस्ते! मैं ${session.user.name} हूं।

📧 Email: ${session.user.email}
🏷️ Role: ${session.user.role}

मुझे निम्नलिखित में से किसी एक के लिए सहायता चाहिए:
• 📝 सेवा आवेदन में समस्या
• 💰 वॉलेट या पेमेंट की समस्या  
• 📄 दस्तावेज़ या प्रमाणपत्र की समस्या
• 🔧 तकनीकी सहायता
• ❓ अन्य प्रश्न या समस्या

कृपया मेरी सहायता करें। धन्यवाद! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast.success('WhatsApp opened! Send your message to get instant support.');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast.error('Please login to send support email');
      return;
    }

    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailForm),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Support email sent successfully! We will respond within 24 hours.');
        setEmailForm({ subject: '', message: '', priority: 'medium' });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email. Please try WhatsApp support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* WhatsApp Support */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <MessageCircle className="w-6 h-6 mr-3" />
            WhatsApp Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Phone className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Instant Support</span>
            </div>
            <p className="text-green-700 text-sm mb-4">
              Get immediate help through WhatsApp. Our support team is available to assist you with:
            </p>
            <ul className="text-sm text-green-600 space-y-1 mb-4">
              <li>• 📝 Service application issues</li>
              <li>• 💰 Wallet and payment problems</li>
              <li>• 📄 Document and certificate queries</li>
              <li>• 🔧 Technical support</li>
              <li>• ❓ General questions</li>
            </ul>
            <div className="flex items-center text-xs text-green-600 mb-4">
              <Clock className="w-4 h-4 mr-1" />
              <span>Available: Mon-Sat, 9 AM - 6 PM</span>
            </div>
          </div>
          
          <Button 
            onClick={handleWhatsAppSupport}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Open WhatsApp Support
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            📱 +91-9819399470 | Instant response guaranteed
          </p>
        </CardContent>
      </Card>

      {/* Email Support */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Mail className="w-6 h-6 mr-3" />
            Email Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-800">Professional Support</span>
              </div>
              <p className="text-blue-700 text-sm">
                Send detailed queries and get comprehensive responses within 24 hours.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority Level
                </Label>
                <Select 
                  value={emailForm.priority} 
                  onValueChange={(value) => setEmailForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low - General inquiry</SelectItem>
                    <SelectItem value="medium">🟡 Medium - Standard support</SelectItem>
                    <SelectItem value="high">🔴 High - Urgent issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject *
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Brief description of your issue"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue in detail. Include any error messages, steps you've taken, and what you were trying to accomplish."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                  rows={6}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200 opacity-100"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Support Email
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Response within 24 hours guaranteed</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
