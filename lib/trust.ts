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

  const { count, error: countError } = await admin
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (countError) throw new Error('Unable to determine approved file count.');

  const approvedFileCount = count ?? 0;
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
