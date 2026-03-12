import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nrlhorhbubopcdmckjzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybGhvcmhidWJvcGNkbWNranpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTc3MjYsImV4cCI6MjA1OTE3MzcyNn0.RF8zb9epQp78a-mVT6xZ0zMPoE9I35GNTuGGdnIEHYI';

// Debug logging for environment variables
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
});

// Test connection on initialization
supabase.from('books').select('count', { count: 'exact', head: true }).then(
  ({ error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test successful');
    }
  }
);

export type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  category: string;
  tags?: string[];
  description?: string;
  image_url?: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  status: 'available' | 'sold' | 'reserved';
};

export type User = {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type StudyGroup = {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  members?: StudyGroupMember[];
};

export type StudyGroupMember = {
  group_id: string;
  user_id: string;
  role: 'creator' | 'member';
  joined_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  duration: number;
  subject?: string;
  started_at: string;
  ended_at?: string;
};

export type Wishlist = {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  book?: Book;
};

export type BookSwap = {
  id: string;
  requester_book_id: string;
  owner_book_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  requester_book?: Book;
  owner_book?: Book;
};

export const BOOK_CATEGORIES = [
  'Engineering',
  'Medical',
  'Law',
  'Business',
  'Competitive Exams'
];

export const BOOK_TAGS = {
  Engineering: [
    'Computer Science',
    'Mechanical',
    'Civil',
    'ECE / EEE',
    'Chemical',
    'Other Engineering'
  ],
  Medical: [
    'MBBS / BDS',
    'Nursing & Pharmacy',
    'Ayurveda',
    'Allied Health',
    'Other Medical'
  ],
  Law: [
    'BA LLB / LLB',
    'LLM',
    'Criminology',
    'Other Law'
  ],
  Business: [
    'BBA / BMS',
    'MBA / PGDM',
    'Accounting',
    'Finance',
    'Other Business'
  ],
  'Competitive Exams': {
    Engineering: [
      'JEE Main',
      'JEE Advanced',
      'GATE',
      'ESE',
      'BITSAT',
      'Other Engineering Exams'
    ],
    Medical: [
      'NEET UG',
      'NEET PG',
      'AIIMS',
      'JIPMER',
      'Other Medical Exams'
    ],
    Law: [
      'CLAT',
      'AILET',
      'LSAT India',
      'Other Law Exams'
    ],
    Management: [
      'CAT',
      'XAT',
      'GMAT',
      'Other Management Exams'
    ],
    'Civil Services': [
      'UPSC',
      'State PSC',
      'Other Civil Services Exams'
    ],
    Banking: [
      'SBI PO',
      'IBPS PO',
      'RBI Grade B',
      'Other Banking Exams'
    ],
    Defence: [
      'NDA',
      'CDS',
      'AFCAT',
      'Other Defence Exams'
    ],
    Teaching: [
      'CTET',
      'State TET',
      'UGC NET',
      'Other Teaching Exams'
    ],
    'Study Abroad': [
      'GRE',
      'TOEFL',
      'IELTS',
      'SAT',
      'Other International Exams'
    ]
  }
};