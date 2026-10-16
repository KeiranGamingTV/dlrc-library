'use client';

import { useState } from 'react';

type Props = {
  initialDisplayName: string;
  initialPublicEnabled: boolean;
  userId: string;
};

export default function ContributorProfileForm({
  initialDisplayName,
  initialPublicEnabled,
  userId,
}: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [publicEnabled, setPublicEnabled] = useState(
    initialPublicEnabled
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          publicEnabled,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Unable to save your profile.'
        );
      }

      setDisplayName(result.displayName ?? '');
      setPublicEnabled(result.publicEnabled);
      setMessage('Profile settings saved.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save your profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  const profileUrl = `/contributors/${userId}`;

  return (
    <section className="card" style={{ marginBottom: '24px' }}>
      <h2>Contributor profile</h2>
      <p className="small">
        Choose how your contributions appear to other visitors.
        Your email address is never displayed on your public profile.
      </p>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="contributor-display-name"
          style={{ display: 'block', marginBottom: '8px' }}
        >
          Public display name
        </label>

        <input
          id="contributor-display-name"
          className="input"
          type="text"
          minLength={2}
          maxLength={40}
          value={displayName}
          onChange={(event) =>
            setDisplayName(event.target.value)
          }
          placeholder="Your contributor name"
          autoComplete="nickname"
          style={{
            display: 'block',
            width: '100%',
            marginBottom: '16px',
          }}
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <input
            type="checkbox"
            checked={publicEnabled}
            onChange={(event) =>
              setPublicEnabled(event.target.checked)
            }
          />
          Make my contributor profile public
        </label>

        {publicEnabled && (
          <p className="small">
            Your public page will show your display name and
            verified contributions.{' '}
            <a href={profileUrl}>View profile</a>
          </p>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save profile settings'}
        </button>

        {message && (
          <p className="small" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
