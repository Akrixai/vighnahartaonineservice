'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Search, HelpCircle, Phone, Mail } from 'lucide-react';
import Logo from '@/components/ui/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const faqData = [
  {
    id: '1',
    question: 'What is विघ्नहर्ता जनसेवा?',
    answer: 'विघ्नहर्ता जनसेवा is a comprehensive digital government service portal that connects citizens with essential government services through our nationwide retailer network. We provide easy access to services like Aadhaar, PAN, passport applications, certificates, and more.',
    category: 'General'
  },
  {
    id: '2',
    question: 'How do I register as a retailer?',
    answer: 'To register as a retailer, click on "Become a Retailer" from our homepage or footer. Fill out the registration form with your business details, upload required documents, and submit your application. Our team will review and approve your application within 2-3 business days.',
    category: 'Registration'
  },
  {
    id: '3',
    question: 'What services are available through the portal?',
    answer: 'We offer a wide range of government services including Aadhaar card services, PAN card applications, passport services, birth/death certificates, income certificates, caste certificates, domicile certificates, and many more. New services are regularly added to our platform.',
    category: 'Services'
  },
  {
    id: '4',
    question: 'How do I apply for a government service?',
    answer: 'After logging into your account, go to the "Services" section, select the service you need, fill out the required information, upload necessary documents, and submit your application. You can track the status of your application in real-time.',
    category: 'Applications'
  },
  {
    id: '5',
    question: 'What documents do I need for service applications?',
    answer: 'Required documents vary by service. Common documents include Aadhaar card, PAN card, passport-size photographs, address proof, income proof, and service-specific documents. Each service page lists the exact requirements.',
    category: 'Documents'
  },
  {
    id: '6',
    question: 'How long does it take to process applications?',
    answer: 'Processing times vary by service type. Most certificate services take 3-7 business days, while services like passport applications may take 2-4 weeks. You will receive real-time updates on your application status.',
    category: 'Processing'
  },
  {
    id: '7',
    question: 'How can I track my application status?',
    answer: 'You can track your application status by logging into your account and visiting the "My Applications" section. You will also receive SMS and email notifications for status updates.',
    category: 'Tracking'
  },
  {
    id: '8',
    question: 'What payment methods are accepted?',
    answer: 'We accept various payment methods including UPI, net banking, debit/credit cards, and digital wallets. All payments are processed through secure payment gateways.',
    category: 'Payment'
  },
  {
    id: '9',
    question: 'Is my personal information secure?',
    answer: 'Yes, we take data security very seriously. All personal information is encrypted and stored securely. We follow government data protection guidelines and never share your information with unauthorized parties.',
    category: 'Security'
  },
  {
    id: '10',
    question: 'How can I contact customer support?',
    answer: 'You can contact our customer support team through phone at +91-7499116527, email at vighnahartaenterprises.sangli@gmail.com, or use the live chat feature available on our website. Our support team is available 24/7.',
    category: 'Support'
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(faqData.map(faq => faq.category)))];

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <Logo size="lg" showText={true} animated={true} />
              <span className="ml-4 text-sm text-red-100">
                Government Service Portal
              </span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-red-100 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-red-100 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/services" className="text-red-100 hover:text-white transition-colors">
                Services
              </Link>
              <Link href="/contact" className="text-red-100 hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/login" className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-full">
              <HelpCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find quick answers to common questions about our services, registration process, and more.
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredFaqs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No FAQs found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFaqs.map((faq) => (
                  <Card key={faq.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full mb-2">
                            {faq.category}
                          </span>
                          <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                        </div>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-6 pb-4 text-gray-600 border-t border-gray-100">
                          <p className="pt-4 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <Phone className="w-5 h-5 mr-2" />
                  Need More Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-red-500" />
                    <span>+91-7499116527</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-red-500" />
                    <span>vighnahartaenterprises.sangli@gmail.com</span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-block mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Contact Us
                </Link>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/register" className="block text-red-600 hover:text-red-800 font-medium">
                    🏪 Become a Retailer
                  </Link>
                  <Link href="/services" className="block text-red-600 hover:text-red-800 font-medium">
                    📋 View Services
                  </Link>
                  <Link href="/about" className="block text-red-600 hover:text-red-800 font-medium">
                    ℹ️ About Us
                  </Link>
                  <Link href="/login" className="block text-red-600 hover:text-red-800 font-medium">
                    🔐 Login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
