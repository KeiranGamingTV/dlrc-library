import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/trust';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function AdminPage({ searchParams }: Props) {
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

  const admin = createAdminClient();
  const params = await searchParams;

  const query = (params.q ?? '').trim().slice(0, 80);
  const allowedStatuses = ['pending', 'approved', 'rejected'];
  const status = allowedStatuses.includes(params.status ?? '')
    ? params.status!
    : 'all';

  const [
    pendingResult,
    approvedResult,
    rejectedResult,
    totalResult,
  ] = await Promise.all([
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),

    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected'),

    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (
    pendingResult.error ||
    approvedResult.error ||
    rejectedResult.error ||
    totalResult.error
  ) {
    throw new Error('Unable to load moderation statistics.');
  }

  let submissionQuery = admin
    .from('submissions')
    .select(
      'id,user_id,title,artist,album,status,created_at,filename,verification_notes'
    )
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    submissionQuery = submissionQuery.eq('status', status);
  }

  if (query) {
    const safeQuery = query.replace(/[,%()]/g, ' ');
    submissionQuery = submissionQuery.ilike(
      'title',
      `%${safeQuery}%`
    );
  }

  const { data: submissions, error: submissionsError } =
    await submissionQuery.limit(100);

  if (submissionsError) {
    throw new Error('Unable to load submissions.');
  }

  const rows = submissions ?? [];
  const submitterIds = [...new Set(rows.map((s) => s.user_id))];

  const { data: submitterProfiles } = submitterIds.length
    ? await admin
        .from('profiles')
        .select('id,role')
        .in('id', submitterIds)
    : { data: [] as { id: string; role: string }[] };

  const roleByUser = new Map(
    (submitterProfiles ?? []).map((p) => [p.id, p.role])
  );

  const owner = isOwner(user.id);

  const pendingCount = pendingResult.count ?? 0;
  const approvedCount = approvedResult.count ?? 0;
  const rejectedCount = rejectedResult.count ?? 0;
  const totalCount = totalResult.count ?? 0;

  const reviewablePending = rows.filter(
    (s) =>
      s.status === 'pending' &&
      (roleByUser.get(s.user_id) !== 'admin' || owner)
  ).length;

  const restrictedPending = rows.filter(
    (s) =>
      s.status === 'pending' &&
      roleByUser.get(s.user_id) === 'admin' &&
      !owner
  ).length;

  return (
    <main className="section">
      <div className="container">
        <div className="admin-review-header">
          <div>
            <div className="small">Administration</div>
            <h1 className="title">Moderation dashboard</h1>
            <p className="subtitle">
              Monitor submissions, review DLRC files, and inspect
              moderation activity.
            </p>
          </div>

          <span className="badge badge-approved">
            {owner ? 'Site owner' : 'Administrator'}
          </span>
        </div>

        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="small">Pending review</div>
            <div className="admin-stat">{pendingCount}</div>
            <div className="small">
              {reviewablePending} reviewable in the displayed results
            </div>
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

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="row">
            <div>
              <h2 style={{ marginTop: 0 }}>Moderation tools</h2>
              <p className="small">
                {totalCount} submissions recorded in the library.
              </p>
            </div>
          </div>

          <div className="actions">
            <Link className="btn btn-primary" href="/admin/analytics">
              Reports &amp; analytics
            </Link>

            <Link className="btn" href="/admin?status=pending">
              Pending submissions
            </Link>

            <Link className="btn" href="/admin?status=rejected">
              Rejected submissions
            </Link>

            <Link className="btn" href="/admin?status=approved">
              Approved submissions
            </Link>
          </div>
        </div>

        {restrictedPending > 0 ? (
          <div className="warning" style={{ marginBottom: 20 }}>
            Some administrator submissions require site-owner review.
            They cannot be reviewed by another administrator.
          </div>
        ) : null}

        <section>
          <div className="row" style={{ marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Submissions</h2>
            <span className="small">
              Showing up to {rows.length} results
            </span>
          </div>

          <form
            method="GET"
            className="card"
            style={{ marginBottom: 16 }}
          >
            <div className="grid grid-2">
              <div className="form-row" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="admin-search">
                  Search by song title
                </label>

                <input
                  id="admin-search"
                  className="input"
                  name="q"
                  defaultValue={query}
                  placeholder="Enter a song title"
                  maxLength={80}
                />
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="admin-status">
                  Status
                </label>

                <select
                  id="admin-status"
                  className="select"
                  name="status"
                  defaultValue={status}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="actions" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="submit">
                Apply filters
              </button>

              <Link className="btn" href="/admin">
                Clear filters
              </Link>
            </div>
          </form>

          {rows.length === 0 ? (
            <div className="card empty">
              No submissions match these filters.
            </div>
          ) : (
            <div className="list">
              {rows.map((submission) => {
                const submitterIsAdmin =
                  roleByUser.get(submission.user_id) === 'admin';

                const canReview =
                  submission.status === 'pending' &&
                  (!submitterIsAdmin || owner);

                return (
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

                        <div
                          className="small"
                          style={{ marginTop: 5 }}
                        >
                          {submission.filename} •{' '}
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

                    <div className="row" style={{ marginTop: 10 }}>
                      <span className="small">
                        {submitterIsAdmin
                          ? 'Uploaded by administrator'
                          : 'Uploaded by user'}
                      </span>

                      {submission.status === 'pending' ? (
                        <span
                          className={`badge ${
                            canReview
                              ? 'badge-approved'
                              : 'badge-pending'
                          }`}
                        >
                          {canReview
                            ? 'Needs your review'
                            : 'Owner review required'}
                        </span>
                      ) : null}
                    </div>

                    {submission.status === 'rejected' &&
                    submission.verification_notes ? (
                      <div className="admin-rejection-preview">
                        {submission.verification_notes}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}

          <p className="small" style={{ marginTop: 14 }}>
            The dashboard displays at most 100 matching submissions.
            Statistics above cover all submissions.
          </p>
        </section>
      </div>
    </main>
  );
}
