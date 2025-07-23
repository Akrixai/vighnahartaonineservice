import Link from 'next/link';
import Logo from '@/components/ui/logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <Logo size="xl" showText={true} animated={true} className="justify-center" />
        </div>

        {/* 404 Error */}
        <div className="mb-8 animate-scale-in">
          <h1 className="text-9xl font-bold text-red-600 mb-4 animate-float">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 animate-slide-in-left">
          <Link
            href="/"
            className="inline-block w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium animate-glow"
          >
            🏠 Go Back Home
          </Link>
          
          <Link
            href="/dashboard"
            className="inline-block w-full bg-white text-red-600 border-2 border-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            📊 Go to Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you think this is an error, please contact our support team.
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <a href="mailto:vighnahartaenterprises.sangli@gmail.com" className="text-red-600 hover:text-red-700">
              📧 Email Support
            </a>
            <a href="tel:+917499116527" className="text-red-600 hover:text-red-700">
              📞 Call Support
            </a>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="fixed top-10 left-10 text-red-200 text-6xl animate-float" style={{ animationDelay: '1s' }}>
          🔍
        </div>
        <div className="fixed top-20 right-10 text-orange-200 text-4xl animate-float" style={{ animationDelay: '2s' }}>
          ❓
        </div>
        <div className="fixed bottom-20 left-20 text-red-200 text-5xl animate-float" style={{ animationDelay: '3s' }}>
          🚫
        </div>
        <div className="fixed bottom-10 right-20 text-orange-200 text-3xl animate-float" style={{ animationDelay: '4s' }}>
          ⚠️
        </div>
      </div>
    </div>
  );
}
