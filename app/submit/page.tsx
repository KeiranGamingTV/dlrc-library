import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubmissionForm } from '@/components/SubmissionForm';

export const dynamic = 'force-dynamic';

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ resubmit?: string }>;
}) {
  const { resubmit } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/auth/login?error=Sign in to submit a DLRC file.'
    );
  }

  let original:
    | {
        id: string;
        title: string;
        artist: string;
        album: string | null;
        duration_ms: number | null;
        year: number | null;
        genre: string | null;
        composer: string | null;
        lyricist: string | null;
        notes: string | null;
        status: string;
        verification_notes: string | null;
      }
    | null = null;

  if (resubmit) {
    const { data } = await supabase
      .from('submissions')
      .select(
        'id,title,artist,album,duration_ms,year,genre,composer,lyricist,notes,status,verification_notes'
      )
      .eq('id', resubmit)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && data.status === 'rejected') {
      original = data;
    }
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1 className="title">
          {original
            ? 'Resubmit a DLRC'
            : 'Submit a DLRC'}
        </h1>

        <p className="subtitle">
          {original
            ? 'Upload a corrected version of your rejected file. Your previous metadata has been carried over and can be changed before resubmitting.'
            : 'Upload your file. The parser will detect the metadata before you submit it for verification.'}
        </p>

        {original ? (
          <div className="resubmission-notice">
            <div className="resubmission-notice-title">
              Reviewer feedback
            </div>

            <p>
              {original.verification_notes ||
                'No rejection reason was provided.'}
            </p>
          </div>
        ) : null}

        <SubmissionForm
          initialValues={
            original
              ? {
                  title: original.title,
                  artist: original.artist,
                  album: original.album ?? '',
                  duration_ms:
                    original.duration_ms?.toString() ?? '',
                  year: original.year?.toString() ?? '',
                  genre: original.genre ?? '',
                  composer: original.composer ?? '',
                  lyricist: original.lyricist ?? '',
                  notes: original.notes ?? '',
                }
              : undefined
          }
          resubmissionId={original?.id}
        />
      </div>
    </main>
  );
}
