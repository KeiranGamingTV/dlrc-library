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
  if (!email || !email.includes('@')) {redirect('/auth/signup?error=Please enter a valid email address.');}
  const password = String(formData.get('password') || '');
  if (password.length < 8 || password.length > 128) {redirect('/auth/signup?error=Password must be between 8 and 128 characters.'  );}
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {  redirect('/auth/signup?error=The site is not configured correctly.');}
  const { error } = await supabase.auth.signUp({email, password, options: {emailRedirectTo:`${siteUrl}/auth/confirm`,},});
  if (error) redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  redirect('/auth/login?error=Check your email to confirm your account.');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
