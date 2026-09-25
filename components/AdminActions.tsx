'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminActions({
  id,  status,}: {
  id: string;
  status: string;}) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  async function act(action: 'approve' | 'reject') {
    if (action === 'approve') {
      const confirmed = window.confirm(
        'Verify and publish this DLRC file? It will become publicly searchable and downloadable.'
      );

      if (!confirmed) return;
    }

    if (action === 'reject' && !notes.trim()) {
      setError(
        'Please provide a reason before rejecting a submission.'
      );
      return;
    }

    setBusy(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/submissions/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Request failed.'
        );
      }

      router.push('/admin');
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Request failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  const isFinal =
    status === 'approved' || status === 'rejected';

  return (
    <div
      className="card"
      style={{ marginTop: 20 }}
    >
      <h2>Verification</h2>

      {isFinal ? (
        <div className="small" style={{ marginBottom: 14 }}>
          This submission has already been reviewed.
        </div>
      ) : (
        <>
          <label className="label">
            Verification notes
          </label>

          <textarea
            className="textarea"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="For approval, add any notes you want saved with the review. For rejection, explain what needs to be corrected."
          />

          <div
            className="small"
            style={{ marginTop: 8 }}
          >
            A rejection reason is required. Approval notes are optional.
          </div>
        </>
      )}

      {error ? (
        <div
          className="error"
          style={{ marginTop: 12 }}
        >
          {error}
        </div>
      ) : null}

      {!isFinal ? (
        <div
          className="actions"
          style={{ marginTop: 16 }}
        >
          <button
            className="btn btn-success"
            disabled={busy}
            onClick={() => act('approve')}
          >
            {busy
              ? 'Processing…'
              : '✓ Verify & publish'}
          </button>
          
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={() => act('reject')}
          >
            {busy ? 'Processing…' : '✕ Reject'}
          </button>
        </div>
      ) : null}
    </div>
  );}