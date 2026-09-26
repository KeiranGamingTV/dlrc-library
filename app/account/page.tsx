import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrustInfo } from '@/lib/trust';
import { logout } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';

function statusClass(status: string) { return status === 'approved' ? 'status-approved' : status === 'rejected' ? 'status-rejected' : 'status-pending'; }
function statusLabel(status: string) { return status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending review'; }

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="section"><div className="container">Please sign in.</div></main>;

  const admin = createAdminClient();
  const [{ data: submissions }, trust] = await Promise.all([
    admin.from('submissions').select('id,title,artist,album,status,created_at,reviewed_at,verification_notes,filename').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    getTrustInfo(user.id),
  ]);

  const rows = submissions ?? [];
  const pendingCount = rows.filter((s) => s.status === 'pending').length;
  const approvedCount = trust.approvedFileCount;
  const rejectedCount = rows.filter((s) => s.status === 'rejected').length;
  const progress = Math.min(100, Math.round((trust.approvedFileCount / trust.threshold) * 100));
  const remaining = Math.max(0, trust.threshold - trust.approvedFileCount);

  return (
    <main className="section">
      <div className="container">
        <div className="row account-header">
          <div><h1 className="title">Account</h1><p className="subtitle">{user.email}</p></div>
          <form action={logout}><button className="btn" type="submit">Sign out</button></form>
        </div>

        <div className="actions account-actions">
          <Link className="btn btn-primary" href="/submit">Submit a DLRC</Link>
          {trust.role === 'admin' ? <Link className="btn" href="/admin">Admin dashboard</Link> : null}
        </div>

        <section className="card trust-card">
          <div className="row trust-card-header">
            <div><div className="small">Contributor status</div><h2>{trust.badge ?? (trust.role === 'admin' ? 'Administrator' : 'Regular User')}</h2></div>
            {trust.badge ? <span className="badge badge-approved">{trust.badge}</span> : null}
          </div>
          <div className="trust-progress-label"><strong>{trust.approvedFileCount} / {trust.threshold}</strong><span>{trust.trusted ? 'Automatic approval enabled' : `${remaining} more approved file${remaining === 1 ? '' : 's'} needed`}</span></div>
          <div className="trust-progress"><div className="trust-progress-fill" style={{ width: `${progress}%` }} /></div>
          <p className="small" style={{ marginBottom: 0 }}>{trust.trusted ? 'New uploads still undergo all server-side DLRC validation and duplicate checks, but they no longer require human review.' : trust.role === 'admin' ? 'Until you reach 10 approved files, administrator submissions require site-owner review.' : 'Until you reach 50 approved files, submissions require administrator review.'}</p>
        </section>

        <div className="account-stats">
          <div className="account-stat"><span>Total submissions</span><strong>{rows.length}</strong></div>
          <div className="account-stat"><span>Pending</span><strong>{pendingCount}</strong></div>
          <div className="account-stat"><span>Approved</span><strong>{approvedCount}</strong></div>
          <div className="account-stat"><span>Rejected</span><strong>{rejectedCount}</strong></div>
        </div>

        <div className="account-section-heading"><div><h2>My submissions</h2><p>Track verification status and reviewer feedback.</p></div></div>
        <div className="submission-list">
          {rows.length === 0 ? <div className="card empty"><div className="empty-title">You have not submitted any files yet.</div><p>Submit your first DLRC file to begin building the library.</p><Link className="btn btn-primary" href="/submit">Submit a DLRC</Link></div> : rows.map((submission) => (
            <div className="submission-card" key={submission.id}>
              <div className="submission-card-header"><div className="submission-card-title"><h3>{submission.title || 'Untitled'}</h3><p>{submission.artist || 'Unknown artist'}{submission.album ? ` • ${submission.album}` : ''}</p></div><span className={`submission-status ${statusClass(submission.status)}`}>{statusLabel(submission.status)}</span></div>
              <div className="submission-card-meta"><span>{submission.filename}</span><span>Submitted {new Date(submission.created_at).toLocaleDateString()}</span>{submission.reviewed_at ? <span>Reviewed {new Date(submission.reviewed_at).toLocaleDateString()}</span> : null}</div>
              {submission.status === 'rejected' ? <><div className="submission-feedback"><div className="submission-feedback-title">Reviewer feedback</div><p>{submission.verification_notes || 'No rejection reason was provided.'}</p></div><div className="submission-card-actions"><Link className="btn btn-primary" href={`/submit?resubmit=${submission.id}`}>Resubmit corrected file</Link></div></> : null}
              {submission.status === 'approved' ? <div className="submission-feedback submission-feedback-success"><div className="submission-feedback-title">Published</div><p>This DLRC has been verified and is now available in the public library.</p></div> : null}
              {submission.status === 'pending' ? <div className="submission-feedback"><p>Your submission is waiting for verification. You do not need to do anything right now.</p></div> : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
