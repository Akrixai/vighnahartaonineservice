import { createClient } from '@supabase/supabase-js';

// Only create the admin client when actually needed (server-side)
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Debug environment variables
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }

  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  console.log('✅ Supabase admin client initialized');

  // Create a Supabase client with service role key for admin operations
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Lazy initialization - only create when needed
let _supabaseAdmin: ReturnType<typeof createSupabaseAdmin> | null = null;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdmin>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createSupabaseAdmin();
    }
    return (_supabaseAdmin as any)[prop];
  }
});
