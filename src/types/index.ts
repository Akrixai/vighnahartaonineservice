export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  RETAILER = 'RETAILER'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  SCHEME_PAYMENT = 'SCHEME_PAYMENT',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  wallet?: Wallet;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  price: number;
  isFree: boolean;
  isActive: boolean;
  category?: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  userId: string;
  schemeId: string;
  formData: Record<string, any>;
  documents: string[];
  status: ApplicationStatus;
  amount?: number;
  approvedBy?: string;
  rejectedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  scheme?: Scheme;
}

export interface Certificate {
  id: string;
  userId: string;
  certificateNumber: string;
  name: string;
  issueDate: Date;
  validUntil?: Date;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingVideo {
  id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Query {
  id: string;
  userId: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  response?: string;
  respondedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Advertisement {
  id: string;
  title: string;
  image: string;
  link?: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface CreateUserForm {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
}

export interface WalletAddMoneyForm {
  amount: number;
}

export interface SchemeApplicationForm {
  [key: string]: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard stats
export interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  monthlyGrowth: number;
  popularSchemes: Array<{
    name: string;
    applications: number;
  }>;
  recentTransactions: Transaction[];
}
