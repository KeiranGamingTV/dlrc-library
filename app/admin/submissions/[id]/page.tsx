import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminActions } from '@/components/AdminActions';

export const dynamic = 'force-dynamic';
export default async function AdminSubmissionPage({ params }: { params: Promise<{id:string}> }) {
  const {id}=await params; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/auth/login');
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle(); if(profile?.role!=='admin') redirect('/account');
  const admin=createAdminClient(); const {data:s}=await admin.from('submissions').select('*').eq('id',id).maybeSingle(); if(!s) notFound();
  const {data:signed}=await admin.storage.from('submissions').createSignedUrl(s.storage_path,300);
  let content=''; if(signed?.signedUrl){ const r=await fetch(signed.signedUrl,{cache:'no-store'}); if(r.ok) content=await r.text(); }
  return <main className="section"><div className="container"><h1 className="title">Review submission</h1><p className="subtitle">{s.filename}</p>
    <div className="grid grid-2"><div className="card"><div className="small">Title</div><div>{s.title}</div><div className="small" style={{marginTop:12}}>Artist</div><div>{s.artist}</div><div className="small" style={{marginTop:12}}>Album</div><div>{s.album||'—'}</div><div className="small" style={{marginTop:12}}>Submitted</div><div>{new Date(s.created_at).toLocaleString()}</div></div><div className="card"><div className="small">Notes</div><div>{s.notes||'—'}</div><div className="small" style={{marginTop:12}}>Status</div><div>{s.status}</div></div></div>
    <section style={{marginTop:20}}><h2>DLRC content</h2><pre className="lyrics">{content}</pre></section>
    <AdminActions id={s.id} status={s.status}/>
  </div></main>;
}
