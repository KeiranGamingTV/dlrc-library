import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/trust';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/account');

  const admin = createAdminClient();
  const { data: submissions } = await admin.from('submissions').select('id,user_id,title,artist,album,status,created_at,filename,duration_ms,verification_notes').order('created_at', { ascending: false }).limit(100);
  const rows = submissions ?? [];
  const submitterIds = [...new Set(rows.map((s) => s.user_id))];
  const { data: submitterProfiles } = submitterIds.length ? await admin.from('profiles').select('id,role').in('id', submitterIds) : { data: [] as { id: string; role: string }[] };
  const roleByUser = new Map((submitterProfiles ?? []).map((p) => [p.id, p.role]));
  const pendingRows = rows.filter((s) => s.status === 'pending');
  const owner = isOwner(user.id);
  const reviewablePending = pendingRows.filter((s) => roleByUser.get(s.user_id) !== 'admin' || owner).length;
  const restrictedPending = pendingRows.length - reviewablePending;
  const pendingCount = pendingRows.length;
  const approvedCount = rows.filter((s) => s.status === 'approved').length;
  const rejectedCount = rows.filter((s) => s.status === 'rejected').length;

  return <main className="section"><div className="container">
    <div className="admin-review-header"><div><div className="small">Administration</div><h1 className="title">Review dashboard</h1><p className="subtitle">Review submitted DLRC files before they enter the public library.</p></div><span className="badge badge-approved">{owner ? 'Site owner' : 'Administrator'}</span></div>
    <div className="grid grid-3" style={{ marginBottom: 24 }}><div className="card"><div className="small">Pending review</div><div className="admin-stat">{pendingCount}</div><div className="small">{reviewablePending} available to you</div></div><div className="card"><div className="small">Approved</div><div className="admin-stat">{approvedCount}</div></div><div className="card"><div className="small">Rejected</div><div className="admin-stat">{rejectedCount}</div></div></div>
    {restrictedPending > 0 ? <div className="warning" style={{ marginBottom: 20 }}>{restrictedPending} administrator submission{restrictedPending === 1 ? '' : 's'} currently require site-owner review.</div> : null}
    <div className="row" style={{ marginBottom: 14 }}><h2 style={{ margin: 0 }}>Submissions</h2><span className="small">Showing the most recent {rows.length}</span></div>
    {rows.length === 0 ? <div className="card empty">There are currently no submissions.</div> : <div className="list">{rows.map((submission) => { const submitterIsAdmin = roleByUser.get(submission.user_id) === 'admin'; const canReview = submission.status === 'pending' && (!submitterIsAdmin || owner); return <Link className="list-item" key={submission.id} href={`/admin/submissions/${submission.id}`}><div className="row"><div style={{ minWidth: 0 }}><strong>{submission.title || 'Untitled'}</strong><div className="meta">{submission.artist || 'Unknown artist'}{submission.album ? ` • ${submission.album}` : ''}</div><div className="small" style={{ marginTop: 5 }}>{submission.filename} • {new Date(submission.created_at).toLocaleString()}</div></div><span className={`badge badge-${submission.status}`}>{submission.status}</span></div><div className="row" style={{ marginTop: 10 }}><span className="small">{submitterIsAdmin ? 'Uploaded by administrator' : 'Uploaded by user'}</span>{submission.status === 'pending' ? <span className={`badge ${canReview ? 'badge-approved' : 'badge-pending'}`}>{canReview ? 'Needs your review' : 'Owner review required'}</span> : null}</div>{submission.status === 'rejected' && submission.verification_notes ? <div className="admin-rejection-preview">{submission.verification_notes}</div> : null}</Link>; })}</div>}
  </div></main>;
}
