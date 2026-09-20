import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="section"><div className="container">Please sign in.</div></main>;
  const { data: submissions } = await supabase.from('submissions').select('id,title,artist,status,created_at,verification_notes').order('created_at',{ascending:false}).limit(50);
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return <main className="section"><div className="container">
    <div className="row"><div><h1 className="title">Account</h1><p className="subtitle">{user.email}</p></div><form action={logout}><button className="btn" type="submit">Sign out</button></form></div>
    <div className="actions" style={{marginBottom:20}}><Link className="btn btn-primary" href="/submit">Submit a DLRC</Link>{profile?.role === 'admin' ? <Link className="btn" href="/admin">Admin dashboard</Link> : null}</div>
    <h2>My submissions</h2>
    <div className="list">{(submissions ?? []).length === 0 ? <div className="empty">You have not submitted any files yet.</div> : submissions!.map(s => <div className="list-item" key={s.id}><div className="row"><div><strong>{s.title || 'Untitled'}</strong><div className="meta">{s.artist || 'Unknown artist'} • {s.status}</div></div></div>{s.verification_notes ? <p className="small">{s.verification_notes}</p> : null}</div>)}</div>
  </div></main>;
}
