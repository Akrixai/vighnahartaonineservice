'use client';

import Link from "next/link";
import Logo from "@/components/ui/logo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSubmitted(true);
    setIsSubmitting(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

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
              <Link href="/contact" className="text-white font-semibold">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up">
            Get in touch with us for any queries, support, or feedback. We're here to help you with all your government service needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">📞</span>
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="text-red-600 text-2xl">📍</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Head Office</h3>
                    <p className="text-gray-600">
                      Vignaharta Janseva Kendra<br />
                      Government Service Complex<br />
                      New Delhi - 110001, India
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="text-red-600 text-2xl">📞</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
                    <p className="text-gray-600">
                      Toll Free: 1800-123-4567<br />
                      Support: +91-11-2345-6789<br />
                      Available: 9 AM - 6 PM (Mon-Sat)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="text-red-600 text-2xl">✉️</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                    <p className="text-gray-600">
                      General: info@vignahartajanseva.gov.in<br />
                      Support: support@vignahartajanseva.gov.in<br />
                      Business: business@vignahartajanseva.gov.in
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="text-red-600 text-2xl">⏰</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 9:00 AM - 2:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">🔗</span>
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">
                    🏪 Become a Retailer
                  </Link>
                  <Link href="/services" className="text-red-600 hover:text-red-800 font-medium">
                    📋 View Services
                  </Link>
                  <Link href="/help" className="text-red-600 hover:text-red-800 font-medium">
                    ❓ Help Center
                  </Link>
                  <Link href="/about" className="text-red-600 hover:text-red-800 font-medium">
                    ℹ️ About Us
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center">
                <span className="text-3xl mr-3">📝</span>
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                  <Button 
                    onClick={() => setSubmitted(false)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="retailer">Retailer Partnership</option>
                        <option value="complaint">Complaint</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your message here..."
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending Message...
                      </div>
                    ) : (
                      '📤 Send Message'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact */}
        <div className="mt-16 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Emergency Support</h2>
          <p className="text-red-100 mb-6 text-lg">
            For urgent issues or emergencies, contact our 24/7 helpline
          </p>
          <div className="text-4xl font-bold mb-2">📞 1800-HELP-NOW</div>
          <p className="text-red-200">Available 24/7 for critical issues</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-red-800 to-red-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <Logo size="md" showText={true} animated={false} className="justify-center" />
            </div>
            <p className="text-red-200 mb-6 text-lg">
              Empowering citizens with digital government services through our retailer network
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <Link href="/about" className="block text-red-200 hover:text-white transition-colors">About Us</Link>
                  <Link href="/services" className="block text-red-200 hover:text-white transition-colors">Services</Link>
                  <Link href="/register" className="block text-red-200 hover:text-white transition-colors">Become a Retailer</Link>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3">Support</h4>
                <div className="space-y-2">
                  <Link href="/contact" className="block text-red-200 hover:text-white transition-colors">Contact Us</Link>
                  <Link href="/help" className="block text-red-200 hover:text-white transition-colors">Help Center</Link>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3">Legal</h4>
                <div className="space-y-2">
                  <Link href="/privacy" className="block text-red-200 hover:text-white transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="block text-red-200 hover:text-white transition-colors">Terms of Service</Link>
                </div>
              </div>
            </div>
            <div className="border-t border-red-700 pt-6 space-y-4">
              <p className="text-red-300 text-sm">
                © 2024 Vignaharta Janseva. All rights reserved. | Government of India Initiative
              </p>

              {/* Akrix AI Branding */}
              <div className="flex items-center justify-center space-x-2 animate-pulse">
                <span className="text-pink-400 text-lg animate-bounce">💖</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 font-semibold text-sm">
                  Developed with Love by
                </span>
                <a
                  href="https://akrix-ai.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold text-sm hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Akrix AI
                </a>
                <span className="text-pink-400 text-lg animate-bounce">💖</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
