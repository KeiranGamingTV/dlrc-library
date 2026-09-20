import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const body = await request.json();
  const action = body.action;
  const notes = String(body.notes || '').slice(0, 4000);
  const admin = createAdminClient();
  const { data: submission, error: getError } = await admin.from('submissions').select('*').eq('id', id).maybeSingle();
  if (getError || !submission) return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });

  if (action === 'reject') {
    const { error } = await admin.from('submissions').update({
      status: 'rejected', verification_notes: notes, reviewed_at: new Date().toISOString(), reviewed_by: user.id
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action !== 'approve') return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  if (submission.status === 'approved') return NextResponse.json({ error: 'Submission is already approved.' }, { status: 409 });

  const { data: duplicate } = await admin.from('songs').select('id').eq('file_hash', submission.file_hash).maybeSingle();
  if (duplicate) return NextResponse.json({ error: 'This file hash is already published.' }, { status: 409 });

  const { data: contentUrl, error: urlError } = await admin.storage.from('submissions').createSignedUrl(submission.storage_path, 60);
  if (urlError || !contentUrl) return NextResponse.json({ error: 'Could not read submitted file.' }, { status: 500 });
  const response = await fetch(contentUrl.signedUrl, { cache: 'no-store' });
  if (!response.ok) return NextResponse.json({ error: 'Could not read submitted file.' }, { status: 500 });
  const content = await response.text();

  const publicPath = `${submission.id}.dlrc`;
  const { error: copyError } = await admin.storage.from('dlrc-files').upload(
    publicPath,
    new Blob([content], { type: 'text/plain; charset=utf-8' }),
    { upsert: false, contentType: 'text/plain; charset=utf-8' }
  );
  if (copyError) return NextResponse.json({ error: copyError.message }, { status: 500 });

  const { error: insertError } = await admin.from('songs').insert({
    id: submission.id,
    title: submission.title,
    artist: submission.artist,
    album: submission.album,
    duration_ms: submission.duration_ms,
    year: submission.year,
    genre: submission.genre,
    composer: submission.composer,
    lyricist: submission.lyricist,
    dlrc_version: submission.parsed_metadata?.version || '1.0',
    file_hash: submission.file_hash,
    storage_path: publicPath,
    content
  });
  if (insertError) {
    await admin.storage.from('dlrc-files').remove([publicPath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await admin.from('submissions').update({
    status: 'approved', verification_notes: notes, reviewed_at: new Date().toISOString(), reviewed_by: user.id
  }).eq('id', id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await admin.storage.from('submissions').remove([submission.storage_path]);
  return NextResponse.json({ ok: true });
}
