'use client';

import { useState } from 'react';
import {
  formatDuration,
  parseDlrc,
  validateDlrc,
  type ParsedDlrc,
} from '@/lib/dlrc/parser';

type InitialValues = {
  title: string;
  artist: string;
  album: string;
  duration_ms: string;
  year: string;
  genre: string;
  composer: string;
  lyricist: string;
  notes: string;
};

export function SubmissionForm({
  initialValues,
  resubmissionId,
}: {
  initialValues?: Partial<InitialValues>;
  resubmissionId?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedDlrc | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function choose(nextFile: File | null) {
    setError('');
    setMessage('');
    setParsed(null);
    setFile(nextFile);

    if (!nextFile) return;

    if (!nextFile.name.toLowerCase().endsWith('.dlrc')) {
      setError('Please select a .dlrc file.');
      return;
    }

    if (nextFile.size > 1024 * 1024) {
      setError('The maximum upload size is 1 MB.');
      return;
    }

    try {
      const text = await nextFile.text();
      const result = parseDlrc(text);
      const errors = validateDlrc(result);

      if (errors.length) {
        setError(errors.join(' '));
      }

      setParsed(result);
    } catch {
      setError('The DLRC file could not be read.');
    }
  }

  async function submit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!file || !parsed) {
      setError('Select a valid DLRC file first.');
      return;
    }

    setBusy(true);

    const form = new FormData(e.currentTarget);

    form.set('file', file);

    if (resubmissionId) {
      form.set('resubmission_id', resubmissionId);
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Submission failed.'
        );
      }

      setMessage(
        resubmissionId
          ? 'Your corrected file has been resubmitted for verification.'
          : 'Submitted for verification. You can track it from your account page.'
      );

      setFile(null);
      setParsed(null);
      e.currentTarget.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Submission failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid" onSubmit={submit}>
      <div className="file-drop">
        <label className="label" htmlFor="file">
          {resubmissionId
            ? 'Corrected DLRC file'
            : 'DLRC file'}
        </label>

        <input
          id="file"
          type="file"
          accept=".dlrc,text/plain"
          onChange={(e) =>
            choose(e.target.files?.[0] ?? null)
          }
        />

        <p className="small">
          {resubmissionId
            ? 'Choose the corrected .dlrc file you want to submit. The previous file will remain in your submission history.'
            : 'The file is parsed in your browser first. Maximum size: 1 MB.'}
        </p>
      </div>

      {error ? (
        <div className="error">{error}</div>
      ) : null}

      {message ? (
        <div className="success">{message}</div>
      ) : null}

      {parsed ? (
        <>
          <div className="card">
            <div className="row">
              <div>
                <h2>Detected song information</h2>

                <p className="small">
                  These values were read from the DLRC file.
                  You can correct them before submitting.
                </p>
              </div>

              <span className="badge">
                {parsed.lines.length} lyric lines
              </span>
            </div>

            <div
              className="grid grid-2"
              style={{ marginTop: 16 }}
            >
              <div className="form-row">
                <label
                  className="label"
                  htmlFor="title"
                >
                  Title
                </label>

                <input
                  id="title"
                  className="input"
                  name="title"
                  defaultValue={
                    parsed.title ||
                    initialValues?.title ||
                    ''
                  }
                  maxLength={300}
                  required
                />
              </div>

              <div className="form-row">
                <label
                  className="label"
                  htmlFor="artist"
                >
                  Artist
                </label>

                <input
                  id="artist"
                  className="input"
                  name="artist"
                  defaultValue={
                    parsed.artist ||
                    initialValues?.artist ||
                    ''
                  }
                  maxLength={300}
                  required
                />
              </div>

              <div className="form-row">
                <label
                  className="label"
                  htmlFor="album"
                >
                  Album
                </label>

                <input
                  id="album"
                  className="input"
                  name="album"
                  defaultValue={
                    parsed.album ||
                    initialValues?.album ||
                    ''
                  }
                  maxLength={300}
                />
              </div>

              <div className="form-row">
                <label
                  className="label"
                  htmlFor="duration_ms"
                >
                  Duration
                </label>

                <input
                  id="duration_ms"
                  className="input"
                  name="duration_ms"
                  defaultValue={
                    parsed.durationMs?.toString() ||
                    initialValues?.duration_ms ||
                    ''
                  }
                  inputMode="numeric"
                  pattern="[0-9]+"
                />

                <p className="small">
                  {formatDuration(parsed.durationMs)}
                  {' · '}
                  {parsed.durationSource === 'metadata'
                    ? 'from [length:]'
                    : parsed.durationSource === 'inferred'
                      ? 'inferred from lyrics'
                      : 'not detected'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Additional song information</h2>

            <p className="small">
              Anything not present in the DLRC file can be
              supplied here.
            </p>

            <div
              className="grid grid-2"
              style={{ marginTop: 16 }}
            >
              <div className="form-row">
                <label
                  className="label"
                  htmlFor="year"
                >
                  Release year
                </label>

                <input
                  id="year"
                  className="input"
                  name="year"
                  type="number"
                  min="0"
                  max="9999"
                  defaultValue={
                    initialValues?.year || ''
                  }
                />
              </div>

              <div className="form-row">
                <label
                  className="label"
                  htmlFor="genre"
                >
                  Genre
                </label>

                <input
                  id="genre"
                  className="input"
                  name="genre"
                  maxLength={120}
                  defaultValue={
                    initialValues?.genre || ''
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <label
                className="label"
                htmlFor="composer"
              >
                Composer
              </label>

              <input
                id="composer"
                className="input"
                name="composer"
                maxLength={500}
                defaultValue={
                  initialValues?.composer || ''
                }
              />
            </div>

            <div className="form-row">
              <label
                className="label"
                htmlFor="lyricist"
              >
                Lyricist
              </label>

              <input
                id="lyricist"
                className="input"
                name="lyricist"
                maxLength={500}
                defaultValue={
                  initialValues?.lyricist || ''
                }
              />
            </div>

            <div className="form-row">
              <label
                className="label"
                htmlFor="notes"
              >
                Notes for reviewer
              </label>

              <textarea
                id="notes"
                className="textarea"
                name="notes"
                maxLength={4000}
                defaultValue={
                  initialValues?.notes || ''
                }
                placeholder="Anything the reviewer should know about this file?"
              />
            </div>
          </div>

          <div className="card">
            <h2>DLRC details</h2>

            <div className="grid grid-3">
              <div>
                <div className="small">
                  DLRC version
                </div>

                <strong>{parsed.version}</strong>
              </div>

              <div>
                <div className="small">
                  Speakers
                </div>

                <strong>
                  {parsed.speakerIds.length
                    ? parsed.speakerIds.join(', ')
                    : '—'}
                </strong>
              </div>

              <div>
                <div className="small">
                  Named colors
                </div>

                <strong>
                  {Object.keys(parsed.colors).length ||
                    'None'}
                </strong>
              </div>
            </div>

            {Object.keys(parsed.metadata).length > 0 ? (
              <details style={{ marginTop: 16 }}>
                <summary className="label">
                  Detected metadata tags
                </summary>

                <pre className="metadata-preview">
                  {Object.entries(parsed.metadata)
                    .map(
                      ([key, value]) =>
                        `${key}: ${value}`
                    )
                    .join('\n')}
                </pre>
              </details>
            ) : null}
          </div>

          {parsed.warnings.length ? (
            <div className="card">
              <strong>Parser warnings</strong>

              <ul>
                {parsed.warnings.map(
                  (warning, i) => (
                    <li
                      className="small"
                      key={i}
                    >
                      {warning}
                    </li>
                  )
                )}
              </ul>

              <p className="small">
                Warnings do not automatically prevent
                submission, but they may require correction
                during verification.
              </p>
            </div>
          ) : null}

          <button
            className="btn btn-primary"
            disabled={
              busy ||
              !parsed.title ||
              !parsed.artist ||
              parsed.lines.length === 0
            }
            type="submit"
          >
            {busy
              ? 'Submitting…'
              : resubmissionId
                ? 'Resubmit for verification'
                : 'Submit for verification'}
          </button>
        </>
      ) : null}
    </form>
  );
}
