import { createClient } from '@supabase/supabase-js';
import { env, validateEnv, serverEnv, validateServerEnv } from './env';

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
}

// Client for browser/frontend
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Admin client for server-side operations
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = (() => {
  // Only create admin client on server side
  if (typeof window !== 'undefined') {
    return null as any;
  }

  if (!supabaseAdminInstance) {
    try {
      validateServerEnv();
      supabaseAdminInstance = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        serverEnv.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    } catch (error) {
      console.error('Failed to create Supabase admin client:', error);
      throw error;
    }
  }

  return supabaseAdminInstance;
})();

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          phone: string | null;
          role: 'ADMIN' | 'EMPLOYEE' | 'RETAILER';
          is_active: boolean;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          date_of_birth: string | null;
          gender: string | null;
          occupation: string | null;
          employee_id: string | null;
          department: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          phone?: string | null;
          role: 'ADMIN' | 'EMPLOYEE' | 'RETAILER';
          is_active?: boolean;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          occupation?: string | null;
          employee_id?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          phone?: string | null;
          role?: 'ADMIN' | 'EMPLOYEE' | 'RETAILER';
          is_active?: boolean;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          occupation?: string | null;
          employee_id?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          type: 'DEPOSIT' | 'WITHDRAWAL' | 'SCHEME_PAYMENT' | 'REFUND' | 'COMMISSION';
          amount: number;
          status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
          description: string | null;
          reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id: string;
          type: 'DEPOSIT' | 'WITHDRAWAL' | 'SCHEME_PAYMENT' | 'REFUND' | 'COMMISSION';
          amount: number;
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
          description?: string | null;
          reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string;
          type?: 'DEPOSIT' | 'WITHDRAWAL' | 'SCHEME_PAYMENT' | 'REFUND' | 'COMMISSION';
          amount?: number;
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
          description?: string | null;
          reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schemes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          is_free: boolean;
          is_active: boolean;
          category: string | null;
          documents: string[];
          processing_time_days: number;
          commission_rate: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price?: number;
          is_free?: boolean;
          is_active?: boolean;
          category?: string | null;
          documents?: string[];
          processing_time_days?: number;
          commission_rate?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          is_free?: boolean;
          is_active?: boolean;
          category?: string | null;
          documents?: string[];
          processing_time_days?: number;
          commission_rate?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          scheme_id: string;
          form_data: any;
          documents: string[];
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
          amount: number | null;
          notes: string | null;
          customer_name: string;
          customer_phone: string | null;
          customer_email: string | null;
          customer_address: string | null;
          created_at: string;
          updated_at: string;
          approved_by: string | null;
          rejected_by: string | null;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheme_id: string;
          form_data: any;
          documents?: string[];
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
          amount?: number | null;
          notes?: string | null;
          customer_name: string;
          customer_phone?: string | null;
          customer_email?: string | null;
          customer_address?: string | null;
          created_at?: string;
          updated_at?: string;
          approved_by?: string | null;
          rejected_by?: string | null;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          scheme_id?: string;
          form_data?: any;
          documents?: string[];
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
          amount?: number | null;
          notes?: string | null;
          customer_name?: string;
          customer_phone?: string | null;
          customer_email?: string | null;
          customer_address?: string | null;
          created_at?: string;
          updated_at?: string;
          approved_by?: string | null;
          rejected_by?: string | null;
          processed_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category: string | null;
          is_active: boolean;
          stock_quantity: number;
          features: string[];
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category?: string | null;
          is_active?: boolean;
          stock_quantity?: number;
          features?: string[];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category?: string | null;
          is_active?: boolean;
          stock_quantity?: number;
          features?: string[];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      training_videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          category: string | null;
          level: string;
          duration_minutes: number | null;
          is_active: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          category?: string | null;
          level?: string;
          duration_minutes?: number | null;
          is_active?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          category?: string | null;
          level?: string;
          duration_minutes?: number | null;
          is_active?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      advertisements: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string;
          link_url: string | null;
          position: string;
          is_active: boolean;
          start_date: string;
          end_date: string | null;
          click_count: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url: string;
          link_url?: string | null;
          position: string;
          is_active?: boolean;
          start_date?: string;
          end_date?: string | null;
          click_count?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image_url?: string;
          link_url?: string | null;
          position?: string;
          is_active?: boolean;
          start_date?: string;
          end_date?: string | null;
          click_count?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      queries: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          message: string;
          type: string;
          status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          priority: string;
          response: string | null;
          created_at: string;
          updated_at: string;
          responded_by: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          message: string;
          type?: string;
          status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          priority?: string;
          response?: string | null;
          created_at?: string;
          updated_at?: string;
          responded_by?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          message?: string;
          type?: string;
          status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          priority?: string;
          response?: string | null;
          created_at?: string;
          updated_at?: string;
          responded_by?: string | null;
          responded_at?: string | null;
        };
      };
    };
  };
};
