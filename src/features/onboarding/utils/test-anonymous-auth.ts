import { supabase } from '@/lib/supabase/client';

export async function testAnonymousAuth() {
  console.log('Testing anonymous authentication...');

  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('❌ Anonymous auth failed:', error.message);
      return { success: false, error };
    }

    console.log('✅ Anonymous auth successful!');
    console.log('User ID:', data.user?.id);
    console.log('Is Anonymous:', data.user?.is_anonymous);
    console.log('Session:', data.session);

    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}
