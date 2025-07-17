// Environment configuration with validation
export const env = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // NextAuth Configuration
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || '',

  // Payment Configuration
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};

// Validation function
export function validateEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => {
    const value = env[varName as keyof typeof env];
    return !value || value === '';
  });

  if (missingVars.length > 0) {
    console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
    // Only throw in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
}

// Server-only environment variables
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};

// Validate server environment
export function validateServerEnv() {
  const requiredServerVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missingVars = requiredServerVars.filter(varName => !serverEnv[varName as keyof typeof serverEnv]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required server environment variables: ${missingVars.join(', ')}`);
  }
}
