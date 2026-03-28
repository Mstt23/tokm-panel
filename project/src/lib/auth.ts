import { supabase } from './supabase';

const DEFAULT_EMAIL = 'admin@tugbaozturkkursmerkezi.com';
const DEFAULT_PASSWORD = 'Mesut-2706';
const INITIALIZED_KEY = 'admin_initialized';

export async function initializeAdmin(): Promise<void> {
  const initialized = localStorage.getItem(INITIALIZED_KEY);
  if (initialized) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Admin initialization error:', signUpError);
      return;
    }

    localStorage.setItem(INITIALIZED_KEY, 'true');
  } catch (error) {
    console.error('Failed to initialize admin:', error);
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      return true;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: DEFAULT_EMAIL,
      password: password,
    });

    return !error;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Yeni şifre en az 8 karakter olmalıdır' };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEFAULT_EMAIL,
        password: currentPassword,
      });

      if (signInError) {
        return { success: false, error: 'Mevcut şifre yanlış' };
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Şifre değiştirme başarısız oldu' };
  }
}

export async function createSession(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    return false;
  }
}

export async function checkSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
}

export async function clearSession(): Promise<void> {
  await supabase.auth.signOut();
}
