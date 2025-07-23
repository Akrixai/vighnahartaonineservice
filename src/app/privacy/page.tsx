import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Vignaharta Janseva | Government Service Portal",
  description: "Read our comprehensive privacy policy to understand how Vignaharta Janseva protects and handles your personal information and data.",
  keywords: "privacy policy, data protection, personal information, security, vignaharta janseva",
  openGraph: {
    title: "Privacy Policy - Vignaharta Janseva",
    description: "Learn about our commitment to protecting your privacy and personal data security.",
    type: "website",
  },
};

export default function PrivacyPage() {
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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: December 2024</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-600">
              <p>We collect information you provide directly to us, such as when you:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Register for an account or apply for services</li>
                <li>Submit applications or documents</li>
                <li>Contact us for support</li>
                <li>Use our website or mobile applications</li>
              </ul>
              <p>This may include:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Personal identification information (name, address, phone number, email)</li>
                <li>Government identification numbers (Aadhaar, PAN, etc.)</li>
                <li>Documents and photographs</li>
                <li>Payment information</li>
                <li>Usage data and preferences</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process your service applications and requests</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Communicate with you about your applications</li>
                <li>Provide customer support</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
                <li>Send important updates and notifications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <div className="space-y-4 text-gray-600">
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Government Agencies:</strong> As required for processing your applications</li>
                <li><strong>Authorized Retailers:</strong> To facilitate service delivery</li>
                <li><strong>Service Providers:</strong> Who help us operate our platform</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
              </ul>
              <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <div className="space-y-4 text-gray-600">
              <p>We implement robust security measures to protect your information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure servers with regular security updates</li>
                <li>Access controls and authentication systems</li>
                <li>Regular security audits and monitoring</li>
                <li>Compliance with government security standards</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <div className="space-y-4 text-gray-600">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Withdraw consent where applicable</li>
                <li>File complaints with relevant authorities</li>
              </ul>
              <p>To exercise these rights, contact us at privacy@vignahartajanseva.gov.in</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <div className="space-y-4 text-gray-600">
              <p>We retain your information for as long as necessary to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide our services</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p>Different types of information may have different retention periods as required by law.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remember your preferences</li>
                <li>Analyze website usage</li>
                <li>Improve user experience</li>
                <li>Provide personalized content</li>
              </ul>
              <p>You can control cookie settings through your browser preferences.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <div className="space-y-4 text-gray-600">
              <p>Our services are not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <div className="space-y-4 text-gray-600">
              <p>We may update this privacy policy from time to time. We will notify you of any material changes by:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications to registered users</li>
                <li>Displaying prominent notices on our platform</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <div className="space-y-4 text-gray-600">
              <p>If you have questions about this privacy policy or our data practices, contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> vighnahartaenterprises.sangli@gmail.com</p>
                <p><strong>Phone:</strong> +91-7499116527</p>
                <p><strong>Address:</strong> Bajrang Nagar, MIDC Kupwad, Maharashtra 416436, India</p>
              </div>
            </div>
          </section>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            By using our services, you acknowledge that you have read and understood this privacy policy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Get Started
            </Link>
            <Link
              href="/contact"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📞 Contact Us
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
