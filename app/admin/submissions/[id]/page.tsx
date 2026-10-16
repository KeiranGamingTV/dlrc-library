import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {  formatDuration,  parseDlrc,  validateDlrc,} from '@/lib/dlrc/parser';
import { AdminActions } from '@/components/AdminActions';
import { isOwner } from '@/lib/trust';

export const dynamic = 'force-dynamic';

export default async function AdminSubmissionPage({
  params,}: {
    params: Promise<{ id: string }>;}) {
      const { id } = await params;

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

  const reviewerIsOwner = isOwner(user.id);

  const admin = createAdminClient();

  const { data: submission } = await admin
  .from('submissions')
  .select('*')
  .eq('id', id)
  .maybeSingle();

  if (!submission) notFound();
  type RevisionHistoryItem = {
    id: string;
    title: string | null;
    artist: string | null;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    resubmission_of: string | null;
  };

  const revisionMap = new Map<string, RevisionHistoryItem>();

  revisionMap.set(submission.id, {
    id: submission.id,
    title: submission.title,
    artist: submission.artist,
    status: submission.status,
    created_at: submission.created_at,
    reviewed_at: submission.reviewed_at,
    resubmission_of: submission.resubmission_of,
  });

  // Walk backward through the original submission chain.
  let parentId: string | null = submission.resubmission_of;

  for (let depth = 0; parentId && depth < 25; depth++) {
    const { data: parent, error: parentError } = await admin
      .from('submissions')
      .select(
        'id,title,artist,status,created_at,reviewed_at,resubmission_of'
      )
      .eq('id', parentId)
      .maybeSingle();

    if (parentError) {
      throw new Error('Unable to load submission revision history.');
    }

    if (!parent) break;

    if (revisionMap.has(parent.id)) break;

    revisionMap.set(parent.id, parent);
    parentId = parent.resubmission_of;
  }

  // Walk forward through revisions that reference each version.
  let frontier = [submission.id];

  for (let depth = 0; frontier.length > 0 && depth < 25; depth++) {
    const { data: children, error: childrenError } = await admin
      .from('submissions')
      .select(
        'id,title,artist,status,created_at,reviewed_at,resubmission_of'
      )
      .in('resubmission_of', frontier)
      .limit(100);

    if (childrenError) {
      throw new Error('Unable to load submission revision history.');
    }

    const nextFrontier: string[] = [];

    for (const child of children ?? []) {
      if (!revisionMap.has(child.id)) {
        revisionMap.set(child.id, child);
        nextFrontier.push(child.id);
      }
    }

    frontier = nextFrontier;
  }

  const revisionHistory = [...revisionMap.values()].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
  );

  const { data: reviewEvents, error: reviewEventsError } =
    await admin
      .from('submission_review_events')
      .select(
        'id,previous_status,new_status,reviewer_id,notes,created_at'
      )
      .eq('submission_id', submission.id)
      .order('created_at', { ascending: true });

  if (reviewEventsError) {
    throw new Error('Unable to load submission audit history.');
  }

  const { data: submitterProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', submission.user_id)
    .maybeSingle();

  const submitterIsAdmin = submitterProfile?.role === 'admin';
  const canReview = submission.status === 'pending' && (!submitterIsAdmin || reviewerIsOwner);

  const { data: signed } = await admin.storage
  .from('submissions')
  .createSignedUrl(submission.storage_path, 300);

  let content = '';

  if (signed?.signedUrl) {
    const response = await fetch(signed.signedUrl, {
      cache: 'no-store',
    });

    if (response.ok) {
      content = await response.text();
    }
  }

  const parsed = content
  ? parseDlrc(content)
  : null;

  const validationErrors = parsed
  ? validateDlrc(parsed)
  : ['The submitted DLRC file could not be read.'];
  
  return (
    <main className="section">
      <div className="container">
        <div className="admin-review-header">
          <div>
            <div className="small">DLRC submission</div>

            <h1 className="title">
              {submission.title || 'Untitled'}
            </h1>

            <p className="subtitle">
              {submission.artist || 'Unknown artist'}
            </p>
          </div>

          <span
            className={`badge badge-${submission.status}`}
          >
            {submission.status}
          </span>
        </div>

        {submitterIsAdmin ? (
          <div className="warning" style={{ marginBottom: 20 }}>
            This submission was uploaded by an administrator.{' '}
            {reviewerIsOwner ? 'You are authorized as the site owner to review it.' : 'Only the site owner can review it.'}
          </div>
        ) : null}

        <div className="grid grid-2">
          <section className="card">
            <h2>Song information</h2>

            <div className="admin-field">
              <span>Title</span>
              <strong>{submission.title || '—'}</strong>
            </div>

            <div className="admin-field">
              <span>Artist</span>
              <strong>{submission.artist || '—'}</strong>
            </div>

            <div className="admin-field">
              <span>Album</span>
              <strong>{submission.album || '—'}</strong>
            </div>

            <div className="admin-field">
              <span>Duration</span>
              <strong>
                {formatDuration(submission.duration_ms)}
              </strong>
            </div>
            
            <div className="admin-field">
              <span>Year</span>
              <strong>{submission.year || '—'}</strong>
            </div>
            
            <div className="admin-field">
              <span>Genre</span>
              <strong>{submission.genre || '—'}</strong>
            </div>
            
            <div className="admin-field">
              <span>Composer</span>
              <strong>{submission.composer || '—'}</strong>
            </div>
            
            <div className="admin-field">
              <span>Lyricist</span>
              <strong>{submission.lyricist || '—'}</strong>
            </div>
          </section>

          <section className="card">
            <h2>DLRC information</h2>

            {parsed ? (
              <>
                <div className="admin-field">
                  <span>DLRC version</span>
                  <strong>{parsed.version}</strong>
                </div>

                <div className="admin-field">
                  <span>Duration source</span>
                  <strong>
                    {parsed.durationSource === 'metadata'
                      ? 'DLRC metadata'
                      : parsed.durationSource === 'inferred'
                        ? 'Inferred from lyrics'
                        : 'Missing'}
                  </strong>
                </div>

                <div className="admin-field">
                  <span>Lyric lines</span>
                  <strong>{parsed.lines.length}</strong>
                </div>

                <div className="admin-field">
                  <span>Speakers</span>
                  <strong>
                    {parsed.speakerIds.length
                      ? parsed.speakerIds.join(', ')
                      : 'None detected'}
                  </strong>
                </div>
                
                <div className="admin-field">
                  <span>Custom colors</span>
                  <strong>
                    {Object.keys(parsed.colors).length}
                  </strong>
                </div>
                
                <div className="admin-field">
                  <span>File</span>
                  <strong>{submission.filename}</strong>
                </div>

                {signed?.signedUrl ? (
                  <div style={{ marginTop: 18 }}>
                    <a
                      className="btn"
                      href={signed.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open raw DLRC
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="error">
                The DLRC file could not be parsed.
              </div>
            )}
          </section>
        </div>

        {parsed?.warnings.length ? (
          <section
            className="card"
            style={{ marginTop: 20 }}
          >
            <h2>Parser warnings</h2>

            <div className="warning-list">
              {parsed.warnings.map((warning, index) => (
                <div key={index} className="warning-item">
                  {warning}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {validationErrors.length ? (
          <section
            className="card"
            style={{ marginTop: 20 }}
          >
            <h2>Validation issues</h2>

            <div className="error-list">
              {validationErrors.map((error, index) => (
                <div key={index} className="error-item">
                  {error}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div
            className="success"
            style={{ marginTop: 20 }}
          >
            This DLRC file passed the current structural validation checks.
          </div>
        )}

        {parsed ? (
          <section style={{ marginTop: 20 }}>
            <div className="row" style={{ marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>
                  Lyric preview
                </h2>
                
                <div className="small">
                  Parsed representation of the submitted DLRC file
                </div>
              </div>
            </div>
            
            <div className="card dlrc-preview">
              {parsed.lines.map((line, index) => (
                <div
                  className="dlrc-preview-line"
                  key={`${line.timestampMs}-${index}`}
                >
                  <span className="dlrc-time">
                    {formatDuration(line.timestampMs)}
                  </span>
                  
                  <span className="dlrc-speaker">
                    {line.speaker}
                  </span>
                  
                  <span
                    className="dlrc-color"
                    style={
                      line.color
                        ? {
                            borderColor: line.color,
                            backgroundColor: `${line.color}18`,
                          }
                        : undefined
                    }
                  >
                    {line.colorName || line.color || 'default'}
                  </span>
                  
                  <span className="dlrc-text">
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        
        <section style={{ marginTop: 20 }}>
          <h2>Original DLRC</h2>
          
          <pre className="lyrics">
            {content || 'Unable to read the submitted file.'}
          </pre>
        </section>
        
                <section style={{ marginTop: 20 }}>
          <div className="card">
            <h2>Uploader notes</h2>
            <div className="lyrics">
              {submission.notes || 'No notes provided.'}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 20 }}>
          <div className="card">
            <h2>Submission version history</h2>

            <p className="small">
              Earlier submissions and corrected revisions remain
              available for moderation review.
            </p>

            {revisionHistory.length === 1 ? (
              <p className="small">
                This submission has no linked revisions.
              </p>
            ) : (
              <div className="list">
                {revisionHistory.map((revision, index) => (
                  <div className="list-item" key={revision.id}>
                    <div className="row">
                      <div>
                        <strong>
                          {index === 0
                            ? 'Original submission'
                            : `Revision ${index}`}
                        </strong>

                        <div className="meta">
                          {revision.title || 'Untitled'} —{' '}
                          {revision.artist || 'Unknown artist'}
                        </div>

                        <div className="small">
                          Submitted{' '}
                          {new Date(
                            revision.created_at
                          ).toLocaleString()}
                        </div>

                        {revision.reviewed_at ? (
                          <div className="small">
                            Reviewed{' '}
                            {new Date(
                              revision.reviewed_at
                            ).toLocaleString()}
                          </div>
                        ) : null}
                      </div>

                      <span
                        className={`badge badge-${revision.status}`}
                      >
                        {revision.status}
                      </span>
                    </div>

                    {revision.id === submission.id ? (
                      <div className="small" style={{ marginTop: 10 }}>
                        Currently viewing this revision
                      </div>
                    ) : (
                      <div style={{ marginTop: 10 }}>
                        <a
                          className="btn"
                          href={`/admin/submissions/${revision.id}`}
                        >
                          Open revision
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section style={{ marginTop: 20 }}>
          <div className="card">
            <h2>Review audit history</h2>

            <p className="small">
              Recorded submission creation and status changes.
            </p>

            {reviewEvents.length === 0 ? (
              <p className="small">
                No audit events are available for this submission.
              </p>
            ) : (
              <div className="list">
                {reviewEvents.map((event) => (
                  <div className="list-item" key={event.id}>
                    <div className="row">
                      <div>
                        <strong>
                          {event.previous_status} → {event.new_status}
                        </strong>

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
                        Recorded user ID: {event.reviewer_id}
                      </p>
                    ) : null}

                    {event.notes ? (
                      <div className="admin-rejection-preview">
                        {event.notes}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <AdminActions
          id={submission.id}
          status={submission.status}
          canReview={canReview}
        />
      </div>
    </main>
  );
}
