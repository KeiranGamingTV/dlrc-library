import { createAdminClient } from '@/lib/supabase/admin';

export type TrustInfo = {
  role: 'user' | 'admin';
  approvedFileCount: number;
  threshold: number;
  trusted: boolean;
  badge: 'Trusted User' | 'Trusted Admin' | null;
};

export async function getTrustInfo(userId: string): Promise<TrustInfo> {
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw new Error('Unable to determine account role.');

  const role = profile?.role === 'admin' ? 'admin' : 'user';
  const threshold = role === 'admin' ? 10 : 50;

    const { data: submissions, error: countError } =
    await admin
      .from('submissions')
      .select('id,status,resubmission_of')
      .eq('user_id', userId);

  if (countError) {
    throw new Error(
      'Unable to determine approved file count.'
    );
  }

  const rows = submissions ?? [];

  // Follow each submission back to its original contribution.
  // Multiple revisions of the same contribution count only once.
  const byId = new Map(
    rows.map((submission) => [
      submission.id,
      submission,
    ])
  );

  function getContributionRoot(id: string): string {
    const visited = new Set<string>();
    let currentId = id;

    while (!visited.has(currentId)) {
      visited.add(currentId);

      const current = byId.get(currentId);

      if (
        !current?.resubmission_of ||
        !byId.has(current.resubmission_of)
      ) {
        return currentId;
      }

      currentId = current.resubmission_of;
    }

    // Malformed cyclic lineage should not grant extra trust credit.
    return currentId;
  }

  const approvedRoots = new Set<string>();

  for (const submission of rows) {
    if (submission.status === 'approved') {
      approvedRoots.add(
        getContributionRoot(submission.id)
      );
    }
  }

  const approvedFileCount = approvedRoots.size;
  const trusted = approvedFileCount >= threshold;

  return {
    role,
    approvedFileCount,
    threshold,
    trusted,
    badge: trusted ? (role === 'admin' ? 'Trusted Admin' : 'Trusted User') : null,
  };
}

export function canAutoApprove(trust: TrustInfo) {
  return trust.trusted;
}

export function isOwner(userId: string) {
  const ownerId = process.env.DLRC_OWNER_USER_ID;
  return Boolean(ownerId && userId === ownerId);
}
