import Link from 'next/link';
import { signup } from '@/lib/auth-actions';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="section"><div className="container" style={{maxWidth:520}}>
    <h1 className="title">Create an account</h1><p className="subtitle">Create an account to submit DLRC files for verification.</p>
    {error ? <div className="error" style={{marginBottom:16}}>{error}</div> : null}
    <form className="card" action={signup}>
      <div className="form-row"><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="form-row"><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" minLength={8}maxLength={128} required autoComplete="new-password" /></div>
      <button className="btn btn-primary" type="submit">Create account</button>
      <p className="small">Already have an account? <Link href="/auth/login">Sign in</Link>.</p>
    </form>
  </div></main>;
}
