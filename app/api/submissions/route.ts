import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSongKey, parseDlrc, validateDlrc } from '@/lib/dlrc/parser';
import { canAutoApprove, getTrustInfo } from '@/lib/trust';
import { publishSubmission } from '@/lib/submissions/publish';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 1024 * 1024;
const MAX_TEXT_LENGTH = 4000;

function clean(value: FormDataEntryValue | null, maxLength = 500) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, maxLength) : null;
}

function optionalInteger(value: FormDataEntryValue | null, min: number, max: number) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'A .dlrc file is required.' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.dlrc')) return NextResponse.json({ error: 'Only .dlrc files are accepted.' }, { status: 400 });
    if (file.type && file.type !== 'text/plain' && file.type !== 'application/octet-stream') return NextResponse.json({ error: 'The uploaded DLRC file must be a text file.' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Maximum file size is 1 MB.' }, { status: 400 });

    const content = await file.text();
    if (!content.length) return NextResponse.json({ error: 'The DLRC file is empty.' }, { status: 400 });

    const parsed = parseDlrc(content);
    const errors = validateDlrc(parsed);
    if (errors.length) return NextResponse.json({ error: errors.join(' '), details: errors, warnings: parsed.warnings }, { status: 400 });

    const title = clean(form.get('title'), 300) ?? parsed.title;
    const artist = clean(form.get('artist'), 300) ?? parsed.artist;
    const album = clean(form.get('album'), 300) ?? (parsed.album || null);
    const durationText = String(form.get('duration_ms') ?? '').trim();
    const durationFromForm = optionalInteger(form.get('duration_ms'), 1, 24 * 60 * 60 * 1000);
    const durationMs = durationFromForm ?? parsed.durationMs;
    const yearText = String(form.get('year') ?? '').trim();
    const year = optionalInteger(form.get('year'), 0, 9999);
    const genre = clean(form.get('genre'), 120);
    const composer = clean(form.get('composer'), 500);
    const lyricist = clean(form.get('lyricist'), 500);
    const notes = clean(form.get('notes'), MAX_TEXT_LENGTH);
    const resubmissionOf = clean(form.get('resubmission_id'), 100);

    if (!title || !artist) return NextResponse.json({ error: 'Title and artist are required.' }, { status: 400 });
    if (title.length > 300 || artist.length > 300) return NextResponse.json({ error: 'Title and artist must be 300 characters or fewer.' }, { status: 400 });
    if (durationText && durationFromForm === null) return NextResponse.json({ error: 'Duration must be a whole number of milliseconds.' }, { status: 400 });
    if (yearText && year === null) return NextResponse.json({ error: 'Release year must be a whole number between 0 and 9999.' }, { status: 400 });

    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const songKey = createSongKey(title, artist, durationMs);
    const admin = createAdminClient();

    const [{ data: submissionDuplicates }, { data: publishedDuplicate }, { data: songKeyDuplicate }] = await Promise.all([
      admin.from('submissions').select('id,status').eq('file_hash', hash).in('status', ['pending', 'approved']).limit(1),
      admin.from('songs').select('id').eq('file_hash', hash).limit(1).maybeSingle(),
      admin.from('songs').select('id').eq('song_key', songKey).limit(1).maybeSingle(),
    ]);

    if (publishedDuplicate) return NextResponse.json({ error: 'This exact DLRC file is already published in the library.' }, { status: 409 });
    if (songKeyDuplicate) return NextResponse.json({ error: 'A matching song is already published in the library.' }, { status: 409 });
    if (submissionDuplicates?.length) return NextResponse.json({ error: 'This exact DLRC file is already awaiting verification.' }, { status: 409 });

    if (resubmissionOf) {
      const { data: original } = await admin.from('submissions').select('id,user_id,status').eq('id', resubmissionOf).maybeSingle();
      if (!original || original.user_id !== user.id || original.status !== 'rejected') {
        return NextResponse.json({ error: 'The resubmission reference is invalid.' }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();
    const path = `${user.id}/${id}.dlrc`;
    const { error: uploadError } = await admin.storage.from('submissions').upload(
      path,
      new Blob([content], { type: 'text/plain; charset=utf-8' }),
      { upsert: false, contentType: 'text/plain; charset=utf-8' }
    );
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { error: insertError } = await admin.from('submissions').insert({
      id,
      user_id: user.id,
      filename: file.name.slice(0, 255),
      storage_path: path,
      file_hash: hash,
      song_key: songKey,
      title,
      artist,
      album,
      duration_ms: durationMs,
      year,
      genre,
      composer,
      lyricist,
      notes,
      resubmission_of: resubmissionOf || null,
      parsed_metadata: { version: parsed.version, durationSource: parsed.durationSource, speakerIds: parsed.speakerIds, colors: parsed.colors, warnings: parsed.warnings },
      validation_errors: [],
      validation_warnings: parsed.warnings,
      status: 'pending',
    });

    if (insertError) {
      await admin.storage.from('submissions').remove([path]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const trust = await getTrustInfo(user.id);

    if (canAutoApprove(trust)) {
      try {
        const result = await publishSubmission(
          id,
          user.id,
          `Automatically approved as ${trust.badge}.`
        );

        return NextResponse.json({
          id,
          ok: true,
          status: 'approved',
          automatic: true,
          badge: trust.badge,
          songId: result.songId,
        });
      } catch (error) {
        console.error('Automatic publication failed:', error);
        return NextResponse.json({
          id,
          ok: true,
          status: 'pending',
          automatic: false,
          badge: trust.badge,
          message: 'Your file passed submission validation but requires review because automatic publication could not be completed.',
        });
      }
    }

    return NextResponse.json({
      id,
      ok: true,
      status: 'pending',
      automatic: false,
      badge: trust.badge,
      approvedFileCount: trust.approvedFileCount,
      threshold: trust.threshold,
    });
  } catch (error) {
    console.error('Submission route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Submission failed.' }, { status: 500 });
  }
}
