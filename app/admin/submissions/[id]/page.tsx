import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {  formatDuration,  parseDlrc,  validateDlrc,} from '@/lib/dlrc/parser';
import { AdminActions } from '@/components/AdminActions';

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

  const admin = createAdminClient();

  const { data: submission } = await admin
  .from('submissions')
  .select('*')
  .eq('id', id)
  .maybeSingle();

  if (!submission) notFound();

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
        
        <AdminActions
          id={submission.id}
          status={submission.status}
        />
      </div>
    </main>
  );
}