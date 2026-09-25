import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') redirect('/account');
  const { data: submissions } = await supabase
    .from('submissions')
    .select(
      'id,title,artist,album,status,created_at,filename,duration_ms,verification_notes'
    )
    .order('created_at', { ascending: false })
    .limit(100);
  const rows = submissions ?? [];
  const pendingCount = rows.filter((s) => s.status === 'pending').length;
  const rejectedCount = rows.filter((s) => s.status === 'rejected').length;
  const approvedCount = rows.filter((s) => s.status === 'approved').length;

  return (
    <main className="section">
      <div className="container">
        <h1 className="title">Admin dashboard</h1>
        
        <p className="subtitle">
          Review DLRC submissions before they enter the public library.
        </p>

        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="small">Pending review</div>
            <div className="admin-stat">{pendingCount}</div>
          </div>

          <div className="card">
            <div className="small">Approved</div>
            <div className="admin-stat">{approvedCount}</div>
          </div>

          <div className="card">
            <div className="small">Rejected</div>
            <div className="admin-stat">{rejectedCount}</div>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Submissions</h2>
          
          <span className="small">
            Showing the most recent {rows.length}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="card empty">
            There are currently no submissions.
          </div>
        ) : (
          <div className="list">
            {rows.map((submission) => (
              <Link
                className="list-item"
                key={submission.id}
                href={`/admin/submissions/${submission.id}`}
              >
                <div className="row">
                  <div style={{ minWidth: 0 }}>
                    <strong>
                      {submission.title || 'Untitled'}
                    </strong>

                    <div className="meta">
                      {submission.artist || 'Unknown artist'}
                      {submission.album
                        ? ` • ${submission.album}`
                        : ''}
                    </div>

                    <div className="small" style={{ marginTop: 5 }}>
                      {submission.filename}
                      {' • '}
                      {new Date(
                        submission.created_at
                      ).toLocaleString()}
                    </div>
                  </div>

                  <span
                    className={`badge badge-${submission.status}`}
                  >
                    {submission.status}
                  </span>
                </div>

                {submission.status === 'rejected' &&
                submission.verification_notes ? (
                  <div className="admin-rejection-preview">
                    {submission.verification_notes}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}