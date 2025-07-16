# 🏛️ Vignaharta Jan Seva - Government Services Portal

<div align="center">
  <img src="public/vignaharta.svg" alt="Vignaharta Jan Seva Logo" width="120" height="120">

  **विघ्नहर्ता जनसेवा - Empowering Citizens Through Digital Services**

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
</div>

---

## 🌟 Overview

**Vignaharta Jan Seva** is a comprehensive digital platform designed to revolutionize government service delivery in India. Built with cutting-edge web technologies, it bridges the gap between citizens and public administration, providing seamless access to various government services, document management, and citizen support.

## ✨ Key Features

### 🔐 **Multi-Role Authentication System**
- **Citizens/Retailers**: Service applications, document management, payment processing
- **Employees**: Application processing, customer support, document verification
- **Administrators**: Complete system management, analytics, user management

### 📋 **Comprehensive Service Management**
- 🎯 Dynamic service catalog with customizable forms
- 📊 Real-time application tracking and status updates
- 📁 Secure document upload and verification system
- 💳 Integrated payment processing with Razorpay
- 📱 QR code-based payment confirmation

### 💬 **Real-Time Communication Hub**
- 💬 Live chat system between retailers and employees
- 📲 WhatsApp notifications for important updates
- 📧 Email notifications for service updates
- 🔔 Real-time status updates using Supabase

### 📊 **Digital Document Management**
- 🔒 Secure document storage and retrieval
- 📄 PDF certificate generation with custom templates
- 🧾 Digital receipt system with professional formatting
- ✅ Document verification workflows

### 🛒 **E-Commerce Integration**
- 📦 Product catalog management
- 📈 Inventory tracking and management
- 🛍️ Order processing and fulfillment
- 💰 Integrated payment gateway

### 📱 **Mobile-First Design**
- 📲 Progressive Web App (PWA) capabilities
- 📱 Mobile-responsive design for all devices
- 👆 Touch-friendly interface
- 🔄 Offline functionality support

## 🚀 Technology Stack

### **Frontend Technologies**
- **Next.js 14** - React framework with App Router for optimal performance
- **TypeScript** - Type-safe development with enhanced developer experience
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Lucide React** - Beautiful and consistent icon library
- **React Hook Form** - Performant forms with easy validation

### **Backend & Database**
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - Database-level security policies
- **Supabase Auth** - Secure authentication and user management
- **Real-time subscriptions** - Live data updates across the platform

### **Third-Party Integrations**
- **Razorpay** - Secure payment processing for Indian market
- **WhatsApp Business API** - Automated notifications and communication
- **SMTP Services** - Email notifications and communication
- **PDF Generation** - Dynamic document and certificate creation

### **Deployment & DevOps**
- **Vercel** - Serverless hosting with global CDN
- **GitHub Actions** - CI/CD pipeline for automated deployments
- **Environment Variables** - Secure configuration management
- **Performance Monitoring** - Real-time application monitoring

## 📁 Project Architecture

```
vighnahartaonineservice/
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router pages
│   │   ├── 📁 api/            # RESTful API endpoints
│   │   ├── 📁 dashboard/      # Role-based dashboard pages
│   │   ├── 📁 login/          # Authentication pages
│   │   └── 📄 globals.css     # Global styling
│   ├── 📁 components/         # Reusable UI components
│   │   ├── 📁 ui/            # Base UI components
│   │   ├── 📁 forms/         # Form components
│   │   └── 📁 layout/        # Layout components
│   ├── 📁 hooks/             # Custom React hooks
│   ├── 📁 lib/               # Utility functions and configurations
│   ├── 📁 types/             # TypeScript type definitions
│   └── 📁 utils/             # Helper functions
├── 📁 public/                # Static assets and images
├── 📄 vercel.json           # Vercel deployment configuration
├── 📄 next.config.js        # Next.js configuration
└── 📄 tailwind.config.js    # Tailwind CSS configuration
```

## 📦 Quick Start Guide

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - [Sign up here](https://supabase.com/)

### 🚀 Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/RajNakti/vighnahartaonineservice.git
cd vighnahartaonineservice
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. Environment Configuration
Copy the example environment file and configure your variables:
```bash
cp .env.example .env.local
```

#### 4. Configure Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# WhatsApp API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### 5. Database Setup
Set up your Supabase database with the required tables and RLS policies. Refer to `DEPLOYMENT.md` for detailed database schema.

#### 6. Start Development Server
```bash
npm run dev
# or
yarn dev
```

🎉 **Success!** Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment to Vercel

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RajNakti/vighnahartaonineservice)

### Manual Deployment Steps

#### 1. **Connect to Vercel**
- Import your GitHub repository to Vercel
- Configure environment variables in Vercel dashboard

#### 2. **Environment Variables**
Set all required environment variables in Vercel dashboard:
- Supabase credentials
- Payment gateway keys
- WhatsApp API tokens
- Email configuration

#### 3. **Deploy**
- Vercel will automatically deploy on every push to main branch
- Custom domain configuration available

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🎯 Feature Highlights

### ✅ **Production-Ready Features**
- ✅ **Multi-Role Authentication** - Secure login for Citizens, Employees, Admins
- ✅ **Real-time Chat System** - Live communication between users
- ✅ **Payment Integration** - Razorpay payment gateway with QR codes
- ✅ **Document Management** - Upload, verify, and download documents
- ✅ **Certificate Generation** - Dynamic PDF certificate creation
- ✅ **WhatsApp Notifications** - Automated notifications via WhatsApp API
- ✅ **Email Notifications** - Professional email templates
- ✅ **Service Applications** - Dynamic form generation for government services
- ✅ **Digital Wallet** - Wallet management with transaction history
- ✅ **Product Catalog** - E-commerce functionality with inventory
- ✅ **Admin Dashboard** - Comprehensive admin management interface
- ✅ **Mobile Responsive** - Optimized for all device sizes
- ✅ **Toast Notifications** - Professional user feedback system

### 🔧 **Technical Features**
- ✅ **TypeScript** - Full type safety across the application
- ✅ **Real-time Updates** - Supabase real-time subscriptions
- ✅ **Security Headers** - Production-ready security configuration
- ✅ **Performance Optimization** - Image optimization and caching
- ✅ **SEO Optimized** - Meta tags and structured data
- ✅ **Error Handling** - Comprehensive error boundaries and logging

## 👥 User Roles & Permissions

### 🏠 **Citizens/Retailers**
- 📝 Register and manage personal accounts
- 💰 Digital wallet management (add/withdraw funds)
- 📋 Apply for various government schemes and services
- 📊 Real-time application status tracking
- 💳 Complete transaction history and receipts
- 🏆 Certificate generation and management (Retailers)
- 💬 Live chat support with employees
- 📱 Mobile-optimized experience

### 👨‍💼 **Employees**
- 📋 Process and review service applications
- ✅ Approve/reject document submissions
- 💬 Provide customer support via live chat
- 📊 Access customer and retailer data
- 🔍 Document verification workflows
- 📈 Performance analytics and reporting

### 🔧 **Administrators**
- 🎛️ Complete system administration and control
- 👥 User management (create/manage employees/retailers)
- 🏛️ Government scheme and service management
- 💰 Financial oversight and refund processing
- 📊 Advanced analytics and reporting dashboards
- 🔧 System configuration and settings
- 📢 Advertisement and content management
- 📲 WhatsApp and email notification management

## 🎨 Design & User Experience

### **Modern UI/UX Features**
- 🎨 **Red-themed Design** - Professional government portal aesthetic
- 📱 **Mobile-First Approach** - Optimized for smartphones and tablets
- 🔄 **Dynamic Navigation** - Role-based menu system
- 📢 **Strategic Advertisement Placement** - Revenue generation opportunities
- ♿ **Accessibility Compliant** - WCAG 2.1 guidelines followed
- ⚡ **Performance Optimized** - Fast loading with smooth animations
- 🌙 **Professional Loading States** - Enhanced user experience

### **Responsive Breakpoints**
- 📱 **Mobile**: 320px - 767px (Touch-optimized)
- 📱 **Tablet**: 768px - 1023px (Hybrid interface)
- 💻 **Desktop**: 1024px+ (Full-featured interface)

## 🔒 Security & Compliance

### **Security Features**
- 🔐 **Multi-layer Authentication** - JWT + Supabase Auth
- 🛡️ **Row Level Security (RLS)** - Database-level protection
- 🔍 **Input Validation** - Comprehensive data sanitization
- 🚫 **SQL Injection Prevention** - Parameterized queries
- 🔒 **HTTPS Enforcement** - End-to-end encryption
- 🛡️ **CSRF Protection** - Cross-site request forgery prevention
- 🔑 **Secure Headers** - XSS and clickjacking protection

### **Compliance Standards**
- ✅ **Data Privacy** - GDPR-compliant data handling
- ✅ **Government Standards** - Indian government portal guidelines
- ✅ **Payment Security** - PCI DSS compliant payment processing

## 🛠️ Development & Maintenance

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run clean        # Clean build artifacts
```

### **Code Quality Standards**
- 📝 **TypeScript** - 100% type coverage
- 🔍 **ESLint** - Code quality enforcement
- 🎨 **Prettier** - Consistent code formatting
- 🎯 **Tailwind CSS** - Utility-first styling
- 📊 **Performance Monitoring** - Real-time metrics

## 📈 Performance Metrics

- ⚡ **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- 🚀 **First Contentful Paint**: < 1.5s
- 📱 **Mobile Performance**: Optimized for 3G networks
- 🔄 **Real-time Updates**: < 100ms latency
- 📦 **Bundle Size**: Optimized with code splitting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support & Documentation

- 📚 **Documentation**: [Wiki](https://github.com/RajNakti/vighnahartaonineservice/wiki)
- 🐛 **Bug Reports**: [Issues](https://github.com/RajNakti/vighnahartaonineservice/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/RajNakti/vighnahartaonineservice/discussions)
- 📧 **Email**: [Contact Us](mailto:support@vighnahartajanseva.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <h3>🙏 Made with ❤️ for Digital India Initiative</h3>
  <p><strong>Vignaharta Jan Seva</strong> - Bridging the gap between citizens and government services</p>

  [![GitHub stars](https://img.shields.io/github/stars/RajNakti/vighnahartaonineservice?style=social)](https://github.com/RajNakti/vighnahartaonineservice/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/RajNakti/vighnahartaonineservice?style=social)](https://github.com/RajNakti/vighnahartaonineservice/network/members)

  **⭐ Star this repository if you find it helpful!**
</div>
