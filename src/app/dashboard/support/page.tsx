'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SupportOptions from '@/components/SupportOptions';
import { showToast } from '@/lib/toast';


const faqData = [
  {
    id: '1',
    question: 'How do I apply for a government service?',
    answer: 'To apply for a government service, go to the "Apply Services" section, choose your desired service, ensure you have sufficient wallet balance, and click "Apply Now". You will be guided through the application process.',
    category: 'Applications'
  },
  {
    id: '2',
    question: 'How do I add money to my wallet?',
    answer: 'Go to the "Wallet" section and click "Add Money". Enter the amount you want to add and complete the payment using our secure payment gateway. The money will be added to your wallet instantly.',
    category: 'Wallet'
  },
  {
    id: '3',
    question: 'How can I track my application status?',
    answer: 'You can track your application status by visiting the "All Applications" section. Here you will see all your applications with their current status - Pending, Approved, or Rejected.',
    category: 'Applications'
  },
  {
    id: '4',
    question: 'What documents do I need for certificate applications?',
    answer: 'Required documents vary by service. Each service page lists the specific documents needed. Common documents include Aadhaar card, address proof, income proof, and educational certificates.',
    category: 'Documents'
  },
  {
    id: '5',
    question: 'How long does it take to process applications?',
    answer: 'Processing time varies by service type. Most certificates take 5-15 working days. You can see the estimated processing time on each service page.',
    category: 'Processing'
  },
  {
    id: '6',
    question: 'Can I get a refund if my application is rejected?',
    answer: 'Yes, if your application is rejected due to technical issues or errors on our part, you will receive a full refund to your wallet. Refunds for document-related rejections are processed case by case.',
    category: 'Refunds'
  }
];

const contactMethods = [
  {
    id: '1',
    title: 'Phone Support',
    description: 'Call our helpline for immediate assistance',
    contact: '+91-7499116527',
    hours: 'Mon-Fri: 9 AM - 6 PM',
    icon: '📞'
  },
  {
    id: '2',
    title: 'Email Support',
    description: 'Send us an email and we\'ll respond within 24 hours',
    contact: 'vighnahartaenterprises.sangli@gmail.com',
    hours: '24/7 Response',
    icon: '📧'
  },

  {
    id: '4',
    title: 'Visit Office',
    description: 'Visit our nearest service center',
    contact: 'Find locations on our website',
    hours: 'Mon-Fri: 10 AM - 5 PM',
    icon: '🏢'
  }
];

export default function SupportPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: ''
  });
  const [showTicketForm, setShowTicketForm] = useState(false);

  if (!session) {
    return null; // Middleware will redirect
  }

  const categories = ['All', ...Array.from(new Set(faqData.map(faq => faq.category)))];

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement ticket submission
    showToast.success('Support ticket submitted successfully!', {
      description: 'We will get back to you soon.'
    });
    setTicketForm({ subject: '', category: '', priority: 'medium', description: '' });
    setShowTicketForm(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Help & Support</h1>
          <p className="text-teal-100">
            Get help with your questions and issues. We're here to assist you 24/7.
          </p>
        </div>

        {/* Support Options - WhatsApp & Email */}
        <SupportOptions />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactMethods.map((method) => (
            <Card key={method.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{method.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                <p className="text-sm font-medium text-blue-600">{method.contact}</p>
                <p className="text-xs text-gray-500">{method.hours}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Ticket */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Need More Help?</CardTitle>
                <CardDescription>Create a support ticket for personalized assistance</CardDescription>
              </div>
              <Button
                onClick={() => setShowTicketForm(!showTicketForm)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {showTicketForm ? '❌ Cancel' : '🎫 Create Ticket'}
              </Button>
            </div>
          </CardHeader>
          {showTicketForm && (
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="technical">Technical Issue</option>
                      <option value="payment">Payment Problem</option>
                      <option value="application">Application Help</option>
                      <option value="account">Account Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Please provide detailed information about your issue..."
                    required
                  />
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  📤 Submit Ticket
                </Button>
              </form>
            </CardContent>
          )}
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Find quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <span className="text-gray-500">
                      {expandedFaq === faq.id ? '−' : '+'}
                    </span>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-3 text-gray-600 border-t border-gray-200">
                      <p className="pt-3">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader>
            <CardTitle className="text-teal-900">📚 Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">📖</div>
                <h4 className="font-medium text-teal-900 mb-1">User Guide</h4>
                <p className="text-teal-700">Comprehensive guide to using our services</p>
                <Button className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs">
                  Download PDF
                </Button>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎥</div>
                <h4 className="font-medium text-teal-900 mb-1">Video Tutorials</h4>
                <p className="text-teal-700">Step-by-step video instructions</p>
                <Button className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs">
                  Watch Videos
                </Button>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-medium text-teal-900 mb-1">Community Forum</h4>
                <p className="text-teal-700">Connect with other users and get help</p>
                <Button className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs">
                  Join Forum
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
