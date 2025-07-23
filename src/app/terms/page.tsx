import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Vignaharta Janseva | Government Service Portal",
  description: "Read our terms and conditions to understand the rules and guidelines for using Vignaharta Janseva government service portal.",
  keywords: "terms and conditions, terms of service, user agreement, vignaharta janseva, legal terms",
  openGraph: {
    title: "Terms & Conditions - Vignaharta Janseva",
    description: "Understand the terms and conditions for using our government service portal.",
    type: "website",
  },
};

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up">
            Please read these terms and conditions carefully before using our services.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: December 2024</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-4 text-gray-600">
              <p>By accessing and using the Vignaharta Janseva platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <div className="space-y-4 text-gray-600">
              <p>Vignaharta Janseva is a government service portal that provides:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Digital access to government services</li>
                <li>Application processing and tracking</li>
                <li>Document verification and submission</li>
                <li>Retailer network for service delivery</li>
                <li>Customer support and assistance</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <div className="space-y-4 text-gray-600">
              <p>As a user of our platform, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and truthful information</li>
                <li>Keep your account credentials secure</li>
                <li>Use the service only for lawful purposes</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to breach security measures</li>
                <li>Report any suspicious activities</li>
                <li>Pay applicable fees for services</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Registration</h2>
            <div className="space-y-4 text-gray-600">
              <p>To use certain features of our service, you must register for an account. You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate registration information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Service Fees and Payments</h2>
            <div className="space-y-4 text-gray-600">
              <p>Service fees are clearly displayed before transaction completion. You agree that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>Prices may change with prior notice</li>
                <li>You are responsible for all applicable taxes</li>
                <li>Payment must be made through authorized methods</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Activities</h2>
            <div className="space-y-4 text-gray-600">
              <p>You may not use our service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Submit false or fraudulent information</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Distribute malware or harmful code</li>
                <li>Attempt unauthorized access to systems</li>
                <li>Interfere with service operations</li>
                <li>Harass or abuse other users or staff</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>
            <div className="space-y-4 text-gray-600">
              <p>While we strive for continuous service availability:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Services may be temporarily unavailable for maintenance</li>
                <li>We do not guarantee uninterrupted access</li>
                <li>Processing times may vary based on government requirements</li>
                <li>Some services may have specific operating hours</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
            <div className="space-y-4 text-gray-600">
              <p>All content on this platform, including but not limited to text, graphics, logos, and software, is the property of Vignaharta Janseva or its licensors and is protected by copyright and other intellectual property laws.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-600">
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We are not liable for indirect or consequential damages</li>
                <li>Our liability is limited to the amount paid for the service</li>
                <li>We are not responsible for third-party actions or decisions</li>
                <li>Government processing delays are beyond our control</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Privacy and Data Protection</h2>
            <div className="space-y-4 text-gray-600">
              <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using our service, you consent to our data practices as described in the Privacy Policy.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <div className="space-y-4 text-gray-600">
              <p>We may terminate or suspend your account and access to the service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>For violation of these terms</li>
                <li>For fraudulent or illegal activities</li>
                <li>At our discretion with reasonable notice</li>
                <li>Upon your request</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
            <div className="space-y-4 text-gray-600">
              <p>These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in New Delhi, India.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
            <div className="space-y-4 text-gray-600">
              <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the service constitutes acceptance of the modified terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>For questions about these terms, contact us:</p>
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
            By using our services, you acknowledge that you have read, understood, and agree to these terms and conditions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Accept & Get Started
            </Link>
            <Link
              href="/contact"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📞 Have Questions?
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
