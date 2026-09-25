import { createClient } from '@/lib/supabase/server';

export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number | null;
  year: number | null;
  genre: string | null;
  composer: string | null;
  lyricist: string | null;
  dlrc_version: string | null;
  content: string;
};

export async function searchSongs(query: string): Promise<Song[]> {
  const supabase = await createClient();
  const q = query.trim();

  const columns =
    'id,title,artist,album,duration_ms,year,genre,composer,lyricist,dlrc_version,content';

  if (!q) {
    const { data } = await supabase
      .from('songs')
      .select(columns)
      .order('title')
      .limit(50);

    return (data ?? []) as Song[];
  }

  const pattern = `%${q}%`;

  const [titleResult, artistResult, albumResult] =
    await Promise.all([
      supabase
        .from('songs')
        .select(columns)
        .ilike('title', pattern)
        .limit(50),

      supabase
        .from('songs')
        .select(columns)
        .ilike('artist', pattern)
        .limit(50),

      supabase
        .from('songs')
        .select(columns)
        .ilike('album', pattern)
        .limit(50),
    ]);

  const byId = new Map<string, Song>();

  for (const row of [
    ...(titleResult.data ?? []),
    ...(artistResult.data ?? []),
    ...(albumResult.data ?? []),
  ]) {
    byId.set(row.id, row as Song);
  }

  return [...byId.values()]
    .sort((a, b) => {
      const titleCompare = a.title.localeCompare(b.title);
      
      if (titleCompare !== 0) {
        return titleCompare;
      }
      
      return a.artist.localeCompare(b.artist);
    })
    .slice(0, 50);
  }
  
export async function getSong(id: string): Promise<Song | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('songs')
    .select(
      'id,title,artist,album,duration_ms,year,genre,composer,lyricist,dlrc_version,content'
    )
    .eq('id', id)
    .maybeSingle();

  return data as Song | null;
}