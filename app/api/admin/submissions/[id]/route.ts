import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/trust';
import { publishSubmission } from '@/lib/submissions/publish';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: reviewerProfile, error: reviewerProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (reviewerProfileError) return NextResponse.json({ error: 'Unable to determine administrator permissions.' }, { status: 500 });
  if (reviewerProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: { action?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const action = body.action;
  const notes = String(body.notes ?? '').trim().slice(0, 4000);

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 });
  }

  if (action === 'reject' && !notes) {
    return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: submission, error: submissionError } = await admin
    .from('submissions')
    .select('id,user_id,status,title,artist,storage_path')
    .eq('id', id)
    .maybeSingle();

  if (submissionError) return NextResponse.json({ error: 'Unable to load submission.' }, { status: 500 });
  if (!submission) return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  if (submission.status !== 'pending') return NextResponse.json({ error: `This submission has already been reviewed. Current status: ${submission.status}.` }, { status: 409 });

  const { data: submitterProfile, error: submitterProfileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', submission.user_id)
    .maybeSingle();

  if (submitterProfileError) return NextResponse.json({ error: 'Unable to determine the submitter account type.' }, { status: 500 });

  const submitterIsAdmin = submitterProfile?.role === 'admin';
  if (submitterIsAdmin && !isOwner(user.id)) {
    return NextResponse.json({ error: 'Administrator submissions can only be reviewed by the site owner.' }, { status: 403 });
  }

  if (action === 'reject') {
    const { error } = await admin
      .from('submissions')
      .update({ status: 'rejected', verification_notes: notes, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) return NextResponse.json({ error: 'Unable to reject the submission.' }, { status: 500 });
    return NextResponse.json({ ok: true, action: 'rejected' });
  }

  try {
    const result = await publishSubmission(id, user.id, notes);
    return NextResponse.json({ ok: true, action: 'approved', songId: result.songId });
  } catch (error) {
    console.error('Publish submission:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to publish the submission.' }, { status: 500 });
  }
}
