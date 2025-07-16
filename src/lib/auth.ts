import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          console.log('Missing credentials:', {
            email: !!credentials?.email,
            password: !!credentials?.password,
            role: !!credentials?.role
          });
          return null;
        }

        try {
          console.log('🔐 Attempting login for:', credentials.email, 'Role:', credentials.role);

          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select(`
              id,
              email,
              name,
              phone,
              role,
              password_hash,
              is_active,
              address,
              city,
              state,
              pincode,
              date_of_birth,
              gender,
              occupation,
              employee_id,
              department,
              created_at,
              wallets (
                id,
                balance
              )
            `)
            .eq('email', credentials.email)
            .single();

          console.log('📊 Database query result:', {
            userFound: !!user,
            error: error?.message,
            userRole: user?.role,
            isActive: user?.is_active
          });

          if (error) {
            console.error('❌ Database error:', error);
            throw new Error(`Database error: ${error.message}`);
          }

          if (!user) {
            console.log('❌ User not found');
            throw new Error('User not found');
          }

          // Check if user is active
          if (!user.is_active) {
            console.log('❌ User is not active');
            throw new Error('User account is not active');
          }

          // Check if role matches (case insensitive)
          const userRole = user.role?.toUpperCase();
          const credentialsRole = credentials.role?.toUpperCase();

          if (userRole !== credentialsRole) {
            console.log('❌ Role mismatch. Expected:', credentialsRole, 'Got:', userRole);
            throw new Error(`Role mismatch. Expected ${credentialsRole}, got ${userRole}`);
          }

          // Verify password
          console.log('🔑 Verifying password...');
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
          console.log('🔑 Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Invalid password');
            throw new Error('Invalid password');
          }

          console.log('✅ Login successful for user:', user.email);

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            address: user.address,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            dateOfBirth: user.date_of_birth,
            gender: user.gender,
            occupation: user.occupation,
            employeeId: user.employee_id,
            department: user.department,
            wallet: user.wallets?.[0] || null,
            createdAt: user.created_at,
            isActive: user.is_active
          };
        } catch (error) {
          console.error('💥 Auth error:', error);
          // Return null to trigger CredentialsSignin error
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
        token.address = user.address;
        token.city = user.city;
        token.state = user.state;
        token.pincode = user.pincode;
        token.dateOfBirth = user.dateOfBirth;
        token.gender = user.gender;
        token.occupation = user.occupation;
        token.employeeId = user.employeeId;
        token.department = user.department;
        token.wallet = user.wallet;
        token.createdAt = user.createdAt;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string;
        session.user.address = token.address as string;
        session.user.city = token.city as string;
        session.user.state = token.state as string;
        session.user.pincode = token.pincode as string;
        session.user.dateOfBirth = token.dateOfBirth as string;
        session.user.gender = token.gender as string;
        session.user.occupation = token.occupation as string;
        session.user.employeeId = token.employeeId as string;
        session.user.department = token.department as string;
        session.user.wallet = token.wallet as any;
        session.user.createdAt = token.createdAt as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
