import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubmissionForm } from '@/components/SubmissionForm';

export const dynamic = 'force-dynamic';
export default async function SubmitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?error=Sign in to submit a DLRC file.');
  return <main className="section"><div className="container" style={{maxWidth:760}}><h1 className="title">Submit a DLRC</h1><p className="subtitle">Upload your file. The parser will detect the metadata before you submit it for verification.</p><SubmissionForm /></div></main>;
}
