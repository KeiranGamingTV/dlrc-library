'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  redirect('/account');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (password.length < 8) redirect('/auth/signup?error=Password must be at least 8 characters.');
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm` } });
  if (error) redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  redirect('/auth/login?error=Check your email to confirm your account.');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
