'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';


import { MessageCircle, Phone, Mail, Clock, HelpCircle } from 'lucide-react';



export default function HelpPage() {
  const { data: session } = useSession();

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <HelpCircle className="w-10 h-10 mr-3" />
            Help & Support
          </h1>
          <p className="text-blue-100 text-xl">
            Get assistance with services, applications, and any questions you may have
          </p>
          <div className="mt-4 flex items-center gap-4 text-blue-100">
            <span>🕒 Available 24/7</span>
            <span>•</span>

            <span>📞 Phone Support</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Phone className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                  <p className="text-gray-600 mb-4">
                    Contact our support team for assistance with your questions.
                  </p>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">📞 +91-7499116527</p>
                    <p className="text-lg font-semibold">📧 vighnahartaenterprises.sangli@gmail.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Phone Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-gray-900">Support Number</div>
                    <div className="text-blue-600 font-mono">+91-7499116527</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Business Hours</div>
                    <div className="text-gray-600">Mon-Fri: 9:00 AM - 6:00 PM</div>
                    <div className="text-gray-600">Sat-Sun: 10:00 AM - 4:00 PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-gray-900">General Support</div>
                    <div className="text-blue-600">vighnahartaenterprises.sangli@gmail.com</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Technical Issues</div>
                    <div className="text-blue-600">vighnahartaenterprises.sangli@gmail.com</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Response Time</div>
                    <div className="text-gray-600">Within 24 hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Support</span>
                    <span className="font-medium text-green-600">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Support</span>
                    <span className="font-medium text-gray-900">9 AM - 6 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Support</span>
                    <span className="font-medium text-gray-900">24 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-gray-600">Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How do I apply for a service?</h4>
                  <p className="text-gray-600 text-sm">
                    Go to "Apply Services" from your dashboard, select the service you need, fill out the required information, and submit your application.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How can I check my application status?</h4>
                  <p className="text-gray-600 text-sm">
                    Visit "My Applications" to view all your submitted applications and their current status.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How do I add money to my wallet?</h4>
                  <p className="text-gray-600 text-sm">
                    Go to "Wallet" section and choose either card/UPI payment or QR code payment to add funds.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">What documents do I need for services?</h4>
                  <p className="text-gray-600 text-sm">
                    Each service has specific document requirements listed on the service page. Common documents include Aadhaar, PAN, and address proof.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How long does processing take?</h4>
                  <p className="text-gray-600 text-sm">
                    Processing times vary by service type. Most services are processed within 7-15 business days.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Can I cancel my application?</h4>
                  <p className="text-gray-600 text-sm">
                    You can cancel pending applications from "My Applications" section. Approved applications cannot be cancelled.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
