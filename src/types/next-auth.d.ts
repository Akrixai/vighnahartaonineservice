import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      dateOfBirth?: string;
      gender?: string;
      occupation?: string;
      employeeId?: string;
      department?: string;
      wallet?: {
        id: string;
        balance: number;
      };
      createdAt?: string;
      isActive?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    employeeId?: string;
    department?: string;
    wallet?: {
      id: string;
      balance: number;
    };
    createdAt?: string;
    isActive?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    employeeId?: string;
    department?: string;
    wallet?: {
      id: string;
      balance: number;
    };
    createdAt?: string;
    isActive?: boolean;
  }
}
