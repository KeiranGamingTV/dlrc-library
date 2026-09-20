import Link from 'next/link';
import { login } from '@/lib/auth-actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="section"><div className="container" style={{maxWidth:520}}>
    <h1 className="title">Sign in</h1><p className="subtitle">An account is only required for submitting DLRC files.</p>
    {error ? <div className="error" style={{marginBottom:16}}>{error}</div> : null}
    <form className="card" action={login}>
      <div className="form-row"><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="form-row"><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" required autoComplete="current-password" /></div>
      <button className="btn btn-primary" type="submit">Sign in</button>
      <p className="small">Need an account? <Link href="/auth/signup">Create one</Link>.</p>
    </form>
  </div></main>;
}
