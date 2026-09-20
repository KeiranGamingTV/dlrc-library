'use client';
import { useState } from 'react';
import { parseDlrc, validateDlrc, type ParsedDlrc } from '@/lib/dlrc/parser';

export function SubmissionForm() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedDlrc | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function choose(f: File | null) {
    setError(''); setMessage(''); setParsed(null); setFile(f);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.dlrc')) return setError('Please select a .dlrc file.');
    if (f.size > 1024 * 1024) return setError('The maximum upload size is 1 MB.');
    const text = await f.text();
    const p = parseDlrc(text);
    const errors = validateDlrc(p);
    if (errors.length) setError(errors.join(' '));
    setParsed(p);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setMessage('');
    if (!file || !parsed) return setError('Select a valid DLRC file first.');
    setBusy(true);
    const form = new FormData(e.currentTarget); form.set('file', file);
    try {
      const res = await fetch('/api/submissions', { method:'POST', body:form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setMessage('Submitted for verification. You can track it from your account page.');
      setFile(null); setParsed(null); e.currentTarget.reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Submission failed.'); }
    finally { setBusy(false); }
  }
  return <form className="grid" onSubmit={submit}>
    <div className="file-drop"><input id="file" type="file" accept=".dlrc,text/plain" onChange={e => choose(e.target.files?.[0] ?? null)} /><p className="small">DLRC files only. Maximum 1 MB.</p></div>
    {error ? <div className="error">{error}</div> : null}{message ? <div className="success">{message}</div> : null}
    {parsed ? <>
      <div className="card"><h2>Detected metadata</h2><div className="grid grid-2">
        <div className="form-row"><label className="label">Title</label><input className="input" name="title" defaultValue={parsed.title} required /></div>
        <div className="form-row"><label className="label">Artist</label><input className="input" name="artist" defaultValue={parsed.artist} required /></div>
        <div className="form-row"><label className="label">Album</label><input className="input" name="album" defaultValue={parsed.album} /></div>
        <div className="form-row"><label className="label">Duration (ms)</label><input className="input" name="duration_ms" defaultValue={parsed.durationMs ?? ''} inputMode="numeric" /></div>
      </div></div>
      <div className="card"><h2>Additional information</h2>
        <div className="grid grid-2"><div className="form-row"><label className="label">Year</label><input className="input" name="year" type="number" min="0" max="9999" /></div><div className="form-row"><label className="label">Genre</label><input className="input" name="genre" /></div></div>
        <div className="form-row"><label className="label">Composer</label><input className="input" name="composer" /></div>
        <div className="form-row"><label className="label">Lyricist</label><input className="input" name="lyricist" /></div>
        <div className="form-row"><label className="label">Notes for reviewer</label><textarea className="textarea" name="notes" placeholder="Anything the reviewer should know about this file?" /></div>
      </div>
      {parsed.warnings.length ? <div className="card"><strong>Parser warnings</strong><ul>{parsed.warnings.map((w,i)=><li className="small" key={i}>{w}</li>)}</ul></div> : null}
      <button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Submitting…' : 'Submit for verification'}</button>
    </> : null}
  </form>;
}
