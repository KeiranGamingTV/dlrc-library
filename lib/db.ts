import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type Song = { id:string; title:string; artist:string; album:string|null; duration_ms:number|null; year:number|null; dlrc_version:string|null; content:string; };

export async function searchSongs(query: string): Promise<Song[]> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) {
    const { data } = await supabase.from('songs').select('id,title,artist,album,duration_ms,year,dlrc_version').order('title').limit(50);
    return (data ?? []) as Song[];
  }

  const pattern = `%${q}%`;
  const [titleResult, artistResult, albumResult] = await Promise.all([
    supabase.from('songs').select('id,title,artist,album,duration_ms,year,dlrc_version').ilike('title', pattern).limit(50),
    supabase.from('songs').select('id,title,artist,album,duration_ms,year,dlrc_version').ilike('artist', pattern).limit(50),
    supabase.from('songs').select('id,title,artist,album,duration_ms,year,dlrc_version').ilike('album', pattern).limit(50),
  ]);

  const byId = new Map<string, Song>();
  for (const row of [...(titleResult.data ?? []), ...(artistResult.data ?? []), ...(albumResult.data ?? [])]) {
    byId.set(row.id, row as Song);
  }
  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 50);
}

export async function getSong(id: string): Promise<Song | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('songs').select('id,title,artist,album,duration_ms,year,dlrc_version,content').eq('id', id).maybeSingle();
  return data as Song | null;
}

export async function getAdminSubmission(id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('submissions').select('*').eq('id', id).maybeSingle();
  return data;
}
