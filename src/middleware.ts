import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from './types';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  userLimit.count++;
  return false;
}

function getClientIP(req: any): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return req.ip || 'unknown';
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Add security headers to all responses
    const response = NextResponse.next();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Rate limiting for API routes
    if (pathname.startsWith('/api/')) {
      const clientIP = getClientIP(req);

      if (isRateLimited(clientIP)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '900', // 15 minutes
              ...securityHeaders,
            },
          }
        );
      }
    }

    // Allow access to public routes
    const publicRoutes = ['/', '/login', '/register', '/about', '/services', '/contact', '/privacy', '/terms', '/refund-policy'];
    if (publicRoutes.includes(pathname)) {
      return response;
    }

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check if user account is active
    if (token.is_active === false) {
      return new NextResponse(
        JSON.stringify({
          error: 'Account is deactivated. Please contact administrator.',
          code: 'ACCOUNT_DEACTIVATED'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders,
          },
        }
      );
    }

    // Role-based access control for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const userRole = token.role as UserRole;

      // Admin routes
      if (pathname.startsWith('/dashboard/employees') || 
          pathname.startsWith('/dashboard/retailers') ||
          pathname.startsWith('/dashboard/queries') ||
          pathname.startsWith('/dashboard/refunds')) {
        if (userRole !== UserRole.ADMIN) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Admin and Employee routes
      if (pathname.startsWith('/dashboard/approvals')) {
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.EMPLOYEE) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Retailer-only routes
      if (pathname.startsWith('/dashboard/certificates')) {
        if (userRole !== UserRole.RETAILER) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Customer and Retailer routes
      if (pathname.startsWith('/dashboard/services') ||
          pathname.startsWith('/dashboard/products') ||
          pathname.startsWith('/dashboard/training') ||
          pathname.startsWith('/dashboard/support')) {
        if (userRole !== UserRole.RETAILER) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Wallet access (Admin, Customer, Retailer)
      if (pathname.startsWith('/dashboard/wallet')) {
        if (userRole === UserRole.EMPLOYEE) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow public routes
        const publicRoutes = ['/', '/login', '/register', '/about', '/services', '/contact', '/privacy', '/terms', '/refund-policy'];
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Require authentication for dashboard routes
        if (pathname.startsWith('/dashboard')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
