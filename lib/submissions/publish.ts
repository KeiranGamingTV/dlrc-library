import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSongKey, parseDlrc, validateDlrc } from '@/lib/dlrc/parser';

export async function publishSubmission(
  submissionId: string,
  reviewerId: string | null,
  verificationNotes = ''
) {
  const admin = createAdminClient();

  const { data: submission, error: submissionError } = await admin
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (submissionError || !submission) throw new Error('Submission not found.');
  if (submission.status !== 'pending') {
    throw new Error(`Only pending submissions can be published. Current status: ${submission.status}.`);
  }

  const { data: signed, error: signedError } = await admin.storage
    .from('submissions')
    .createSignedUrl(submission.storage_path, 300);

  if (signedError || !signed?.signedUrl) throw new Error('Could not read submitted file.');

  const response = await fetch(signed.signedUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not read submitted file.');

  const content = await response.text();
  const hash = crypto.createHash('sha256').update(content).digest('hex');

  if (hash !== submission.file_hash) {
    throw new Error('The stored DLRC file no longer matches its recorded hash.');
  }

  const parsed = parseDlrc(content);
  const validationErrors = validateDlrc(parsed);

  if (validationErrors.length) {
    await admin.from('submissions').update({
      validation_errors: validationErrors,
      validation_warnings: parsed.warnings,
    }).eq('id', submissionId).eq('status', 'pending');

    throw new Error(`The DLRC failed validation: ${validationErrors.join(' ')}`);
  }

  const songKey = createSongKey(
    submission.title || parsed.title,
    submission.artist || parsed.artist,
    submission.duration_ms ?? parsed.durationMs
  );

  const { data: duplicateByHash } = await admin
    .from('songs')
    .select('id')
    .eq('file_hash', hash)
    .maybeSingle();

  if (duplicateByHash) throw new Error('This exact DLRC file is already published in the library.');

  const { data: duplicateBySong } = await admin
    .from('songs')
    .select('id,title,artist,duration_ms')
    .eq('song_key', songKey)
    .limit(1)
    .maybeSingle();

  if (duplicateBySong) {
    throw new Error('A matching song is already published in the library.');
  }

  const publicPath = `${submission.id}.dlrc`;

  const { error: copyError } = await admin.storage
    .from('dlrc-files')
    .upload(
      publicPath,
      new Blob([content], { type: 'text/plain; charset=utf-8' }),
      { upsert: false, contentType: 'text/plain; charset=utf-8' }
    );

  if (copyError) throw new Error(copyError.message);

  const { error: insertError } = await admin.from('songs').insert({
    id: submission.id,
    title: submission.title || parsed.title,
    artist: submission.artist || parsed.artist,
    album: submission.album || parsed.album || null,
    duration_ms: submission.duration_ms ?? parsed.durationMs,
    year: submission.year,
    genre: submission.genre,
    composer: submission.composer,
    lyricist: submission.lyricist,
    dlrc_version: parsed.version || '1.0',
    file_hash: hash,
    storage_path: publicPath,
    content,
    song_key: songKey,
  });

  if (insertError) {
    await admin.storage.from('dlrc-files').remove([publicPath]);
    throw new Error(insertError.message);
  }

  const { error: updateError } = await admin
    .from('submissions')
    .update({
      status: 'approved',
      verification_notes: verificationNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      validation_errors: [],
      validation_warnings: parsed.warnings,
    })
    .eq('id', submissionId)
    .eq('status', 'pending');

  if (updateError) {
    await admin.from('songs').delete().eq('id', submission.id);
    await admin.storage.from('dlrc-files').remove([publicPath]);
    throw new Error(updateError.message);
  }

  await admin.storage.from('submissions').remove([submission.storage_path]);

  return {
    songId: submission.id,
    songKey,
  };
}
