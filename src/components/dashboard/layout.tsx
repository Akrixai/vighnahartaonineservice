'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { UserRole } from '@/types';
import Logo from '@/components/ui/logo';
import AdvertisementCarousel from '@/components/AdvertisementCarousel';
import ReceiptNotifications from '@/components/ReceiptNotifications';
import PopupAdvertisement from '@/components/PopupAdvertisement';
import WhatsAppNotificationTrigger from '@/components/WhatsAppNotificationTrigger';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.RETAILER] },
  { name: 'Wallet', href: '/dashboard/wallet', icon: '💰', roles: [UserRole.ADMIN, UserRole.RETAILER] },
  { name: 'Apply Services', href: '/dashboard/services', icon: '📝', roles: [UserRole.RETAILER] },
  { name: 'Free Services', href: '/dashboard/free-services', icon: '🆓', roles: [UserRole.RETAILER] },
  { name: 'My Applications', href: '/dashboard/applications', icon: '📋', roles: [UserRole.RETAILER] },
  { name: 'Service Receipts', href: '/dashboard/receipts', icon: '📄', roles: [UserRole.RETAILER] },
  { name: 'My Orders', href: '/dashboard/orders', icon: '📦', roles: [UserRole.RETAILER] },
  { name: 'Products', href: '/dashboard/products', icon: '🛍️', roles: [UserRole.RETAILER, UserRole.EMPLOYEE] },
  { name: 'Certificates', href: '/dashboard/certificates', icon: '🏆', roles: [UserRole.RETAILER] },
  { name: 'Employee Certificate', href: '/dashboard/employee/certificates', icon: '🏆', roles: [UserRole.EMPLOYEE] },
  { name: 'Training Videos', href: '/dashboard/training-videos', icon: '🎥', roles: [UserRole.RETAILER, UserRole.EMPLOYEE] },

  // Admin Management Section
  { name: 'Manage Products', href: '/dashboard/admin/products', icon: '📦', roles: [UserRole.ADMIN] },
  { name: 'Manage Training', href: '/dashboard/admin/training', icon: '🎬', roles: [UserRole.ADMIN] },
  { name: 'Manage Applications', href: '/dashboard/admin/applications', icon: '📋', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Order Management', href: '/dashboard/orders', icon: '📋', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Manage Services', href: '/dashboard/admin/services', icon: '⚙️', roles: [UserRole.ADMIN] },
  { name: 'Manage Free Services', href: '/dashboard/admin/free-services', icon: '🆓', roles: [UserRole.ADMIN] },
  { name: 'Free Services Analytics', href: '/dashboard/admin/free-services-analytics', icon: '📊', roles: [UserRole.ADMIN] },
  { name: 'Website Analytics', href: '/dashboard/admin/analytics', icon: '📈', roles: [UserRole.ADMIN] },
  { name: 'Manage Advertisements', href: '/dashboard/admin/ads', icon: '📢', roles: [UserRole.ADMIN] },
  { name: 'Login Advertisements', href: '/dashboard/admin/advertisements', icon: '🔑', roles: [UserRole.ADMIN] },
  { name: 'Document Approval', href: '/dashboard/admin/documents', icon: '📄', roles: [UserRole.ADMIN] },
  { name: 'All Certificates', href: '/dashboard/admin/certificates', icon: '🏆', roles: [UserRole.ADMIN] },
  { name: 'Branch Management', href: '/dashboard/admin/branches', icon: '🏢', roles: [UserRole.ADMIN] },
  { name: 'User Management', href: '/dashboard/admin/users', icon: '👥', roles: [UserRole.ADMIN] },
  { name: 'Registration Requests', href: '/dashboard/admin/pending-registrations', icon: '👤', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Transactions', href: '/dashboard/transactions', icon: '💳', roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.RETAILER] },
  { name: 'Wallet Approvals', href: '/dashboard/admin/wallet-approvals', icon: '💰', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  { name: 'Help & Support', href: '/dashboard/support', icon: '🆘', roles: [UserRole.RETAILER] },

  { name: 'My Profile', href: '/dashboard/profile', icon: '👤', roles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.RETAILER] },
  { name: 'Change Password', href: '/dashboard/change-password', icon: '🔒', roles: [UserRole.RETAILER] },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Middleware will redirect
  }

  const userRole = session.user.role;
  const userName = session.user.name;
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-600';
      case UserRole.EMPLOYEE: return 'bg-red-500';
      case UserRole.RETAILER: return 'bg-red-700';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-red-800 to-red-900 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col`}>
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-red-700 to-red-800 border-b border-red-600">
          <Link href="/" className="text-white">
            <Logo size="md" showText={true} animated={true} />
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-red-600">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${getRoleColor(userRole)} flex items-center justify-center text-white font-bold shadow-lg`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-red-200 capitalize">{userRole.toLowerCase()}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 flex-1">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg text-red-100 hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Sidebar Advertisement */}
        <div className="p-4 border-t border-red-600">
          <AdvertisementCarousel
            position="sidebar"
            height="h-32"
            className="rounded-lg"
            autoPlay={true}
            autoPlayInterval={6000}
            showControls={false}
            showIndicators={false}
          />
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-red-600">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg text-red-200 hover:bg-red-700 hover:text-white transition-all duration-200"
          >
            <span className="mr-3 text-lg">🚪</span>
            Logout
          </button>
        </div>

        {/* Akrix.ai Branding */}
        <div className="p-4 border-t border-red-600">
          <a
            href="https://akrix-ai.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg text-red-200 hover:bg-red-700 hover:text-white transition-all duration-200 bg-red-800/50"
          >
            <span className="mr-2 text-sm">🚀</span>
            Developed by Akrix.ai
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 shadow-lg border-b border-red-500">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-red-100 hover:text-white hover:bg-red-700 transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Advertisement Space */}
            <div className="hidden lg:block flex-1 max-w-lg mx-4">
              <AdvertisementCarousel
                position="header"
                height="h-12"
                className="rounded-md"
                autoPlay={true}
                autoPlayInterval={8000}
                showControls={false}
                showIndicators={false}
              />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-red-100">
                Welcome, {userName}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        {/* Footer Advertisement */}
        <footer className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <AdvertisementCarousel
              position="footer"
              height="h-24"
              className="rounded-lg"
              autoPlay={true}
              autoPlayInterval={7000}
              showControls={false}
              showIndicators={true}
            />
          </div>
        </footer>

      </div>

      {/* Popup Advertisement */}
      <PopupAdvertisement />

      {/* Receipt Notifications */}
      <ReceiptNotifications />

      {/* WhatsApp Notification Trigger */}
      <WhatsAppNotificationTrigger />
    </div>
  );
}
