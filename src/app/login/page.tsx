'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';
import Logo from '@/components/ui/logo';
import SafeLoginAdvertisements from '@/components/SafeLoginAdvertisements';
import { showToast } from '@/lib/toast';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole;
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: roleParam || UserRole.RETAILER
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login with:', {
        email: formData.email,
        role: formData.role,
        passwordLength: formData.password.length
      });

      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        redirect: false,
      });

      console.log('Login result:', result);

      if (result?.error) {
        console.error('Login failed:', result.error);
        let errorMessage = 'Login failed';

        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email, password, or role. Please check your credentials and try again.';
        } else {
          errorMessage = `Login failed: ${result.error}`;
        }

        let description = '';
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid credentials';
          description = 'Please check your email, password, and role selection.';
        } else {
          errorMessage = 'Login failed';
          description = result.error;
        }
        showToast.error(errorMessage, { description });
      } else if (result?.ok) {
        console.log('Login successful, redirecting to dashboard');
        showToast.success('Login successful!', {
          description: 'Redirecting to your dashboard...'
        });
        // Small delay to ensure session is set
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        console.error('Unexpected login result:', result);
        showToast.error('Login failed', {
          description: 'Unexpected response from server. Please try again.'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast.error('Login error', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'text-red-600 border-red-500';
      case UserRole.EMPLOYEE: return 'text-red-500 border-red-400';
      case UserRole.RETAILER: return 'text-red-700 border-red-600';
      default: return 'text-gray-600 border-gray-500';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return '⚙️';
      case UserRole.EMPLOYEE: return '👨‍💼';
      case UserRole.RETAILER: return '🏪';
      default: return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-6rem)]">

          {/* Advertisement Section - Left Side */}
          <div className="hidden lg:block">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-red-800 mb-4">
                  Welcome to विघ्नहर्ता जनसेवा
                </h2>
                <p className="text-lg text-red-600 mb-8">
                  Your gateway to seamless government services
                </p>
              </div>
              <SafeLoginAdvertisements className="h-[500px]" />
            </div>
          </div>

          {/* Login Section - Right Side */}
          <div className="max-w-md w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" showText={true} animated={true} />
          </Link>
          <h2 className="text-3xl font-extrabold text-red-800 mb-4">
            Sign in to your account
          </h2>
          <div className={`flex items-center justify-center space-x-3 p-4 border-2 rounded-xl shadow-lg bg-white ${getRoleColor(formData.role)}`}>
            <span className="text-3xl">{getRoleIcon(formData.role)}</span>
            <span className="font-bold text-lg capitalize">{formData.role.toLowerCase()} Login</span>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-xl shadow-lg text-white animate-scale-in">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-2">🔐 Secure Login Portal</h3>
            <p className="text-red-100 text-sm">
              Access your dashboard and manage government services securely
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form className="bg-white p-8 rounded-xl shadow-xl border border-red-200 animate-slide-in-left" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-red-700 mb-2">
                Login as
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors"
              >
                <option value={UserRole.RETAILER}>🏪 Retailer</option>
                <option value={UserRole.EMPLOYEE}>👨‍💼 Employee</option>
                <option value={UserRole.ADMIN}>⚙️ Admin</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-red-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors"
                placeholder="Enter your email address"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-red-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 shadow-lg hover:shadow-xl animate-glow'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>🔐 Sign in</>
              )}
            </button>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm">
              <a href="#" className="font-medium text-red-600 hover:text-red-700 transition-colors">
                Forgot your password?
              </a>
            </div>
            {formData.role === UserRole.RETAILER && (
              <div className="text-sm">
                <Link href="/register" className="font-medium text-red-600 hover:text-red-700 transition-colors">
                  Register as Retailer
                </Link>
              </div>
            )}
          </div>
        </form>

        {/* Back to Home */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 transition-colors font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
