import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/account');
  const { data: submissions, error: submissionsError } = await supabase  .from('submissions')  .select('id,title,artist,status,created_at,filename')  .order('created_at', { ascending: false })  .limit(100);
  if (submissionsError) {  throw new Error(`Failed to load submissions: ${submissionsError.message}`);}
  return <main className="section"><div className="container"><h1 className="title">Admin dashboard</h1><p className="subtitle">Review pending uploads before they enter the public library.</p><div className="list">{(submissions??[]).map(s=><Link className="list-item" key={s.id} href={`/admin/submissions/${s.id}`}><div className="row"><div><strong>{s.title || 'Untitled'}</strong><div className="meta">{s.artist || 'Unknown artist'} • {s.filename}</div></div><span className="badge" style={s.status!=='approved'?{color:'#fde68a',borderColor:'#5c4b1a'}:{}}>{s.status}</span></div></Link>)}</div></div></main>;
}
