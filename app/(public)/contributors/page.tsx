import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Contributors · DLRC Library',
  description: 'Discover contributors who help build the verified DLRC Library.',
};

export const dynamic = 'force-dynamic';

export default async function ContributorsPage() {
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id,display_name')
    .eq('public_profile_enabled', true)
    .not('display_name', 'is', null)
    .order('display_name', { ascending: true })
    .limit(200);

  if (error) {
    throw new Error('Unable to load contributors.');
  }

  const contributors = profiles ?? [];

  return (
    <main className="section">
      <div className="container">
        <h1 className="title">Contributors</h1>

        <p className="subtitle">
          Meet the people helping expand the verified DLRC Library.
        </p>

        {contributors.length === 0 ? (
          <div className="card empty">
            <div className="empty-title">
              No public contributor profiles yet
            </div>
            <p>
              Contributors can enable their public profiles from
              their account settings.
            </p>
          </div>
        ) : (
          <div className="grid grid-2">
            {contributors.map((profile) => (
              <Link
                key={profile.id}
                className="list-item"
                href={`/contributors/${profile.id}`}
              >
                <strong>{profile.display_name}</strong>
                <p className="small">
                  View verified contributions →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
