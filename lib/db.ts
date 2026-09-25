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

export async function searchSongs(
  query: string,
  limit = 25,
  offset = 0
) {
  const supabase = await createClient();

  const search = query.trim();

  let request = supabase
    .from('songs')
    .select(
      `
        id,
        title,
        artist,
        album,
        duration_ms,
        year,
        genre,
        composer,
        lyricist,
        dlrc_version
      `,
      { count: 'exact' }
    )
    .order('artist', { ascending: true })
    .order('title', { ascending: true })
    .order('id', { ascending: true })
    .range(
      offset,
      offset + limit - 1
    );

  if (search) {
    const escaped = search
      .replace(/[%_]/g, '\\$&')
      .replace(/,/g, ' ');

    request = request.or(
      `title.ilike.%${escaped}%,artist.ilike.%${escaped}%,album.ilike.%${escaped}%`
    );
  }

  const { data, error, count } = await request;

  if (error) {
    console.error(
      'searchSongs:',
      error
    );

    throw new Error(
      'Unable to search the DLRC library.'
    );
  }

  return {
    songs: data ?? [],
    total: count ?? 0,
  };
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