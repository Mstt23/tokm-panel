import { supabase } from '../lib/supabase';

async function createAdminUser() {
  console.log('Creating admin user...');

  const email = 'admin@tugbaozturk.com';
  const password = 'admin123456';
  const username = 'admin';

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    if (!authData.user) {
      console.error('No user created');
      return;
    }

    console.log('User created:', authData.user.id);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        role: 'admin',
        full_name: 'Administrador'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Username:', username);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();
