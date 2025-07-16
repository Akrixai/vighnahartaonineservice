import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Vignaharta Janseva | Government Service Portal",
  description: "Learn about Vignaharta Janseva, India's premier digital government service portal connecting citizens with essential services through our retailer network.",
  keywords: "government services, digital india, online services, retailer network, vignaharta janseva, about us",
  openGraph: {
    title: "About Vignaharta Janseva - Digital Government Services",
    description: "Discover how Vignaharta Janseva is revolutionizing access to government services across India through our innovative retailer network.",
    type: "website",
  },
};

export default function AboutPage() {
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
              <Link href="/about" className="text-white font-semibold">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            About Vignaharta Janseva
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up">
            Bridging the gap between citizens and government services through innovative digital solutions and a nationwide retailer network.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg hover-lift">
            <div className="text-red-600 text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To democratize access to government services by creating a seamless digital platform that connects citizens with essential services through our trusted retailer network, ensuring no one is left behind in India&apos;s digital transformation journey.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg hover-lift">
            <div className="text-red-600 text-4xl mb-4">👁️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To become India&apos;s most trusted and comprehensive government service portal, empowering every citizen with easy access to digital services while creating sustainable livelihood opportunities for retailers across the nation.
            </p>
          </div>
        </div>

        {/* What We Do */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">🏛️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Government Services</h3>
              <p className="text-gray-600">
                Provide easy access to essential government services including Aadhaar, PAN, passport applications, and various certificates.
              </p>
            </div>
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Retailer Network</h3>
              <p className="text-gray-600">
                Build and support a nationwide network of retailers who serve as service points for citizens in their local communities.
              </p>
            </div>
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">💻</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Platform</h3>
              <p className="text-gray-600">
                Maintain a robust, secure, and user-friendly digital platform that ensures smooth service delivery and real-time tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Vignaharta Janseva?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Fast Processing</h3>
              <p className="text-red-100 text-sm">Quick turnaround times for all service applications</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2">Secure Platform</h3>
              <p className="text-orange-100 text-sm">Bank-grade security for all your documents and data</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold mb-2">Mobile Friendly</h3>
              <p className="text-green-100 text-sm">Access services anytime, anywhere from any device</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-blue-100 text-sm">Track your application status in real-time</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-red-200">Active Retailers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-red-200">Services Delivered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-red-200">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-red-200">Uptime</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who trust Vignaharta Janseva for their government service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Become a Retailer
            </Link>
            <Link
              href="/services"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📋 View Services
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
