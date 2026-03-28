import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('HATA: Supabase environment variables eksik!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Mevcut' : 'EKSİK');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Mevcut' : 'EKSİK');
  console.error('Lütfen hosting sağlayıcınızda bu değişkenleri ayarlayın.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  content: string;
  cta: string;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  grade: string;
  phone: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  student_name: string;
  student_grade: string;
  content: string;
  rating: number;
  image_url?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutUs {
  id: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
