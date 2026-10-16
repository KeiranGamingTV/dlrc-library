import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
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

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [
    total,
    pending,
    approved,
    rejected,
    recentSubmissions,
    recentReviews,
    recentApproved,
    recentRejected,
    latestSubmissions,
    latestEvents,
  ] = await Promise.all([
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true }),

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
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),

    admin
      .from('submission_review_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso)
      .neq('new_status', 'pending'),

    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('reviewed_at', sinceIso),

    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .gte('reviewed_at', sinceIso),

    admin
      .from('submissions')
      .select('id,title,artist,status,created_at')
      .order('created_at', { ascending: false })
      .limit(15),

    admin
      .from('submission_review_events')
      .select(
        'id,submission_id,previous_status,new_status,reviewer_id,notes,created_at'
      )
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const errors = [
    total.error,
    pending.error,
    approved.error,
    rejected.error,
    recentSubmissions.error,
    recentReviews.error,
    recentApproved.error,
    recentRejected.error,
    latestSubmissions.error,
    latestEvents.error,
  ].filter(Boolean);

  if (errors.length) {
    throw new Error(
      'Unable to load reports. Confirm that the moderation audit migration has been applied.'
    );
  }

  const totalCount = total.count ?? 0;
  const approvedCount = approved.count ?? 0;
  const rejectedCount = rejected.count ?? 0;
  const reviewedCount = approvedCount + rejectedCount;

  const approvalRate =
    reviewedCount > 0
      ? Math.round((approvedCount / reviewedCount) * 100)
      : 0;

  const recentApprovedCount = recentApproved.count ?? 0;
  const recentRejectedCount = recentRejected.count ?? 0;
  const recentReviewedCount =
    recentApprovedCount + recentRejectedCount;

  const recentApprovalRate =
    recentReviewedCount > 0
      ? Math.round(
          (recentApprovedCount / recentReviewedCount) * 100
        )
      : 0;

  const recentRows = latestSubmissions.data ?? [];
  const eventRows = latestEvents.data ?? [];

  const submissionIds = [
    ...new Set(eventRows.map((event) => event.submission_id)),
  ];

  const { data: eventSubmissions } = submissionIds.length
    ? await admin
        .from('submissions')
        .select('id,title,artist')
        .in('id', submissionIds)
    : { data: [] as { id: string; title: string; artist: string }[] };

  const submissionById = new Map(
    (eventSubmissions ?? []).map((submission) => [
      submission.id,
      submission,
    ])
  );

  return (
    <main className="section">
      <div className="container">
        <Link href="/admin" className="small">
          ← Back to moderation
        </Link>

        <h1 className="title" style={{ marginTop: 20 }}>
          Reports &amp; analytics
        </h1>

        <p className="subtitle">
          An overview of library submissions and moderation activity.
        </p>

        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="small">Total submissions</div>
            <div className="admin-stat">{totalCount}</div>
          </div>

          <div className="card">
            <div className="small">Pending</div>
            <div className="admin-stat">
              {pending.count ?? 0}
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

          <div className="card">
            <div className="small">Overall approval rate</div>
            <div className="admin-stat">{approvalRate}%</div>
            <p className="small">
              Of all reviewed submissions
            </p>
          </div>

          <div className="card">
            <div className="small">Submissions in the last 30 days</div>
            <div className="admin-stat">
              {recentSubmissions.count ?? 0}
            </div>
          </div>
        </div>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2>Last 30 days</h2>

          <div className="grid grid-3">
            <div>
              <div className="small">Approved</div>
              <div className="admin-stat">
                {recentApprovedCount}
              </div>
            </div>

            <div>
              <div className="small">Rejected</div>
              <div className="admin-stat">
                {recentRejectedCount}
              </div>
            </div>

            <div>
              <div className="small">Approval rate</div>
              <div className="admin-stat">
                {recentApprovalRate}%
              </div>
            </div>
          </div>

          <p className="small" style={{ marginBottom: 0 }}>
            The approval rate excludes submissions still awaiting review.
            Review-event activity counts are available from the date the
            audit log was installed.
          </p>

          <div style={{ marginTop: 16 }}>
            <strong>
              {recentReviews.count ?? 0}
            </strong>{' '}
            <span className="small">
              review status changes recorded in the last 30 days
            </span>
          </div>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2>Recent submissions</h2>

          {recentRows.length === 0 ? (
            <div className="card empty">
              No submissions have been recorded.
            </div>
          ) : (
            <div className="list">
              {recentRows.map((submission) => (
                <Link
                  className="list-item"
                  key={submission.id}
                  href={`/admin/submissions/${submission.id}`}
                >
                  <div className="row">
                    <div>
                      <strong>
                        {submission.title || 'Untitled'}
                      </strong>

                      <div className="meta">
                        {submission.artist || 'Unknown artist'}
                      </div>

                      <div className="small">
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
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2>Recent moderation activity</h2>

          {eventRows.length === 0 ? (
            <div className="card empty">
              No audit events have been recorded yet.
            </div>
          ) : (
            <div className="list">
              {eventRows.map((event) => {
                const submission = submissionById.get(
                  event.submission_id
                );

                return (
                  <article className="list-item" key={event.id}>
                    <div className="row">
                      <div>
                        <strong>
                          {submission?.title || 'Submission'}
                        </strong>

                        <div className="meta">
                          {submission?.artist || 'Unknown artist'}
                        </div>

                        <div className="small">
                          {event.previous_status} → {event.new_status}
                        </div>

                        <div className="small">
                          {new Date(
                            event.created_at
                          ).toLocaleString()}
                        </div>
                      </div>

                      <span
                        className={`badge badge-${event.new_status}`}
                      >
                        {event.new_status}
                      </span>
                    </div>

                    {event.reviewer_id ? (
                      <p className="small">
                        Reviewer ID: {event.reviewer_id}
                      </p>
                    ) : null}

                    {event.notes ? (
                      <div className="admin-rejection-preview">
                        {event.notes}
                      </div>
                    ) : null}

                    {submission ? (
                      <p style={{ marginBottom: 0, marginTop: 12 }}>
                        <Link
                          className="btn"
                          href={`/admin/submissions/${event.submission_id}`}
                        >
                          View submission
                        </Link>
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
