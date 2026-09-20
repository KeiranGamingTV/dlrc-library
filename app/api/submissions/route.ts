import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDlrc, validateDlrc } from '@/lib/dlrc/parser';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'A .dlrc file is required.' }, { status: 400 });
  if (!file.name.toLowerCase().endsWith('.dlrc')) return NextResponse.json({ error: 'Only .dlrc files are accepted.' }, { status: 400 });
  if (file.size > 1024 * 1024) return NextResponse.json({ error: 'Maximum file size is 1 MB.' }, { status: 400 });

  const content = await file.text();
  const parsed = parseDlrc(content);
  const errors = validateDlrc(parsed);
  if (errors.length) return NextResponse.json({ error: errors.join(' ') }, { status: 400 });

  const hash = crypto.createHash('sha256').update(content).digest('hex');
  const admin = createAdminClient();
  const { data: duplicate } = await admin.from('submissions').select('id').eq('file_hash', hash).limit(1).maybeSingle();
  if (duplicate) return NextResponse.json({ error: 'This exact DLRC file has already been submitted.' }, { status: 409 });

  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.dlrc`;
  const { error: uploadError } = await admin.storage.from('submissions').upload(
    path,
    new Blob([content], { type: 'text/plain; charset=utf-8' }),
    { upsert: false, contentType: 'text/plain; charset=utf-8' }
  );
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const toOptionalNumber = (value: FormDataEntryValue | null) => {
    const parsedNumber = Number(value);
    return value && String(value).trim() && Number.isFinite(parsedNumber) ? parsedNumber : null;
  };
  const clean = (value: FormDataEntryValue | null) => {
    const text = String(value ?? '').trim();
    return text || null;
  };

  const { error: insertError } = await admin.from('submissions').insert({
    id,
    user_id: user.id,
    filename: file.name,
    storage_path: path,
    file_hash: hash,
    title: String(form.get('title') || parsed.title).trim(),
    artist: String(form.get('artist') || parsed.artist).trim(),
    album: clean(form.get('album')) ?? (parsed.album || null),
    duration_ms: toOptionalNumber(form.get('duration_ms')) ?? parsed.durationMs,
    year: toOptionalNumber(form.get('year')),
    genre: clean(form.get('genre')),
    composer: clean(form.get('composer')),
    lyricist: clean(form.get('lyricist')),
    notes: clean(form.get('notes')),
    parsed_metadata: parsed,
    status: 'pending'
  });

  if (insertError) {
    await admin.storage.from('submissions').remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ id, ok: true });
}
