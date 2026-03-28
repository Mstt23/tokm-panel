import { supabase } from './supabase';

export type UserRole = 'admin' | 'finance' | 'staff' | 'teacher' | 'student';

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error('E-posta veya şifre hatalı');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  return { user: data.user, profile };
}

export async function signUp(email: string, password: string, username: string, role: UserRole, fullName?: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Kullanıcı oluşturulurken hata oluştu');

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      username,
      role,
      full_name: fullName
    });

  if (profileError) throw profileError;

  return authData.user;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return profile;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) throw error;
}

export function hasPermission(userRole: UserRole, resource: string, action: 'view' | 'edit' | 'delete'): boolean {
  if (userRole === 'admin') return true;

  const permissions: Record<UserRole, Record<string, string[]>> = {
    admin: {},
    finance: {
      students: ['view'],
      finance: ['view', 'edit']
    },
    staff: {
      students: ['view', 'edit'],
      courses: ['view', 'edit']
    },
    teacher: {
      students: ['view'],
      courses: ['view'],
      attendance: ['view', 'edit']
    },
    student: {
      own_data: ['view']
    }
  };

  return permissions[userRole]?.[resource]?.includes(action) || false;
}
