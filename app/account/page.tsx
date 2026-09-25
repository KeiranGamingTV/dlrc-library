import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';

function statusClass(status: string) {
  if (status === 'approved') return 'status-approved';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
}

function statusLabel(status: string) {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending review';
}

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="section">
        <div className="container">
          Please sign in.
        </div>
      </main>
    );
  }

  const { data: submissions } = await supabase
    .from('submissions')
    .select(
      'id,title,artist,album,status,created_at,reviewed_at,verification_notes,filename'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const pendingCount =
    submissions?.filter((s) => s.status === 'pending').length ?? 0;

  const approvedCount =
    submissions?.filter((s) => s.status === 'approved').length ?? 0;

  const rejectedCount =
    submissions?.filter((s) => s.status === 'rejected').length ?? 0;

  return (
    <main className="section">
      <div className="container">
        <div className="row account-header">
          <div>
            <h1 className="title">Account</h1>
            <p className="subtitle">{user.email}</p>
          </div>

          <form action={logout}>
            <button className="btn" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <div className="actions account-actions">
          <Link className="btn btn-primary" href="/submit">
            Submit a DLRC
          </Link>

          {profile?.role === 'admin' ? (
            <Link className="btn" href="/admin">
              Admin dashboard
            </Link>
          ) : null}
        </div>

        <div className="account-stats">
          <div className="account-stat">
            <span>Total submissions</span>
            <strong>{submissions?.length ?? 0}</strong>
          </div>

          <div className="account-stat">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="account-stat">
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>

          <div className="account-stat">
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>

        <div className="account-section-heading">
          <div>
            <h2>My submissions</h2>
            <p>
              Track verification status and respond to reviewer feedback.
            </p>
          </div>
        </div>

        <div className="submission-list">
          {(submissions ?? []).length === 0 ? (
            <div className="card empty">
              <div className="empty-title">
                You have not submitted any files yet.
              </div>

              <p>
                Submit your first DLRC file to begin building the library.
              </p>

              <Link className="btn btn-primary" href="/submit">
                Submit a DLRC
              </Link>
            </div>
          ) : (
            submissions!.map((submission) => (
              <div className="submission-card" key={submission.id}>
                <div className="submission-card-header">
                  <div className="submission-card-title">
                    <h3>{submission.title || 'Untitled'}</h3>

                    <p>
                      {submission.artist || 'Unknown artist'}
                      {submission.album
                        ? ` • ${submission.album}`
                        : ''}
                    </p>
                  </div>

                  <span
                    className={`submission-status ${statusClass(
                      submission.status
                    )}`}
                  >
                    {statusLabel(submission.status)}
                  </span>
                </div>

                <div className="submission-card-meta">
                  <span>{submission.filename}</span>

                  <span>
                    Submitted{' '}
                    {new Date(
                      submission.created_at
                    ).toLocaleDateString()}
                  </span>

                  {submission.reviewed_at ? (
                    <span>
                      Reviewed{' '}
                      {new Date(
                        submission.reviewed_at
                      ).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>

                {submission.status === 'rejected' ? (
                  <div className="submission-feedback">
                    <div className="submission-feedback-title">
                      Reviewer feedback
                    </div>

                    <p>
                      {submission.verification_notes ||
                        'No rejection reason was provided.'}
                    </p>
                  </div>
                ) : null}

                {submission.status === 'approved' ? (
                  <div className="submission-feedback submission-feedback-success">
                    <div className="submission-feedback-title">
                      Published
                    </div>

                    <p>
                      This DLRC has been verified and is now available
                      in the public library.
                    </p>
                  </div>
                ) : null}

                {submission.status === 'pending' ? (
                  <div className="submission-feedback">
                    <p>
                      Your submission is waiting for verification.
                      You do not need to do anything right now.
                    </p>
                  </div>
                ) : null}

                {submission.status === 'rejected' ? (
                  <div className="submission-card-actions">
                    <Link
                      className="btn btn-primary"
                      href={`/submit?resubmit=${submission.id}`}
                    >
                      Resubmit corrected file
                    </Link>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
