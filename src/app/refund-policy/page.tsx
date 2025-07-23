import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - Vignaharta Janseva | Government Service Portal",
  description: "Learn about our refund policy for government services. Understand when refunds are available and how to request them.",
  keywords: "refund policy, money back guarantee, vignaharta janseva, government services refund",
  openGraph: {
    title: "Refund Policy - Vignaharta Janseva",
    description: "Understand our refund policy for government services.",
    type: "website",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center">
              <Logo size="md" showText={true} animated={false} />
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/about" className="text-red-100 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/services" className="text-red-100 hover:text-white transition-colors">
                Services
              </Link>
              <Link href="/contact" className="text-red-100 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            Refund Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up">
            We are committed to providing excellent service. Please read our refund policy carefully.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: December 2024</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Refund Eligibility</h2>
            <div className="space-y-4 text-gray-600">
              <p>Refunds may be available in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Service was not delivered within the promised timeframe due to our error</li>
                <li>Technical issues on our platform prevented service completion</li>
                <li>Duplicate payment was made for the same service</li>
                <li>Service was cancelled by government authorities</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Non-Refundable Services</h2>
            <div className="space-y-4 text-gray-600">
              <p>The following are generally not eligible for refunds:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Services that have been successfully completed and delivered</li>
                <li>Applications rejected by government authorities due to incorrect information provided by the customer</li>
                <li>Services cancelled by the customer after processing has begun</li>
                <li>Free services and consultations</li>
                <li>Processing fees for government applications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Refund Process</h2>
            <div className="space-y-4 text-gray-600">
              <p>To request a refund, please follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Contact our customer support team within 7 days of the issue</li>
                <li>Provide your application ID and payment details</li>
                <li>Explain the reason for the refund request with supporting documents</li>
                <li>Our team will review your request within 3-5 business days</li>
                <li>If approved, refunds will be processed within 7-10 business days</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Refund Methods</h2>
            <div className="space-y-4 text-gray-600">
              <p>Refunds will be processed using the same payment method used for the original transaction:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Credit/Debit Card: 5-7 business days</li>
                <li>UPI/Digital Wallet: 1-3 business days</li>
                <li>Net Banking: 3-5 business days</li>
                <li>Cash payments: Refunded to your wallet for future use</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partial Refunds</h2>
            <div className="space-y-4 text-gray-600">
              <p>In some cases, partial refunds may be applicable:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>When part of the service has been completed</li>
                <li>Processing fees may be deducted for administrative costs</li>
                <li>Third-party charges (government fees) are non-refundable</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Dispute Resolution</h2>
            <div className="space-y-4 text-gray-600">
              <p>If you disagree with our refund decision:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You may escalate the matter to our senior management team</li>
                <li>Provide additional documentation to support your case</li>
                <li>We will conduct a thorough review within 10 business days</li>
                <li>Our decision after escalation will be final</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>For refund requests or questions about this policy, contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> vighnahartaenterprises.sangli@gmail.com</p>
                <p><strong>Phone:</strong> +91-7499116527</p>
                <p><strong>WhatsApp:</strong> +91-7499116527</p>
                <p><strong>Office Hours:</strong> Monday to Saturday, 9:00 AM to 6:00 PM</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Policy Updates</h2>
            <div className="space-y-4 text-gray-600">
              <p>We reserve the right to update this refund policy at any time. Changes will be effective immediately upon posting on our website. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
            </div>
          </section>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Have questions about our refund policy? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📞 Contact Support
            </Link>
            <Link
              href="/dashboard"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Go to Dashboard
            </Link>
          </div>
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
                  <Link href="/contact" className="block text-red-200 hover:text-white transition-colors">Contact</Link>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3">Legal</h4>
                <div className="space-y-2">
                  <Link href="/privacy" className="block text-red-200 hover:text-white transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="block text-red-200 hover:text-white transition-colors">Terms of Service</Link>
                  <Link href="/refund-policy" className="block text-red-200 hover:text-white transition-colors">Refund Policy</Link>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3">Support</h4>
                <div className="space-y-2">
                  <p className="text-red-200">📞 +91 9764664021</p>
                  <p className="text-red-200">📧 support@vignahartajanseva.gov.in</p>
                  <p className="text-red-200">💬 WhatsApp Support</p>
                </div>
              </div>
            </div>
            <div className="border-t border-red-700 pt-6">
              <p className="text-red-300 text-sm">
                © 2024 Vignaharta Janseva. All rights reserved. | 
                <a 
                  href="https://akrix-ai.netlify.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-200 hover:text-white ml-2"
                >
                  Developed by Akrix.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
