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

export type SongSearchResult = Omit<
  Song,
  'content'
>;

export type ArtistSummary = {
  artist: string;
  song_count: number;
};

export type AlbumSummary = {
  artist: string;
  album: string;
  song_count: number;
};

function escapeIlike(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

export async function searchSongs(
  query: string,
  limit = 25,
  offset = 0,
  options: {
    artist?: string;
    album?: string;
    year?: number | null;
    sort?: 'relevance' | 'title' | 'artist' | 'year';
  } = {}
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
    );

  if (search) {
    const escaped = escapeIlike(search);

    request = request.or(
      `title.ilike.%${escaped}%,artist.ilike.%${escaped}%,album.ilike.%${escaped}%`
    );
  }

  if (options.artist?.trim()) {
    request = request.ilike(
      'artist',
      `%${escapeIlike(options.artist.trim())}%`
    );
  }

  if (options.album?.trim()) {
    request = request.ilike(
      'album',
      `%${escapeIlike(options.album.trim())}%`
    );
  }

  if (
    options.year !== null &&
    options.year !== undefined &&
    Number.isInteger(options.year)
  ) {
    request = request.eq('year', options.year);
  }

  switch (options.sort) {
    case 'title':
      request = request
        .order('title', { ascending: true })
        .order('artist', { ascending: true })
        .order('id', { ascending: true });
      break;

    case 'year':
      request = request
        .order('year', {
          ascending: false,
          nullsFirst: false,
        })
        .order('artist', { ascending: true })
        .order('title', { ascending: true })
        .order('id', { ascending: true });
      break;

    case 'artist':
      request = request
        .order('artist', { ascending: true })
        .order('title', { ascending: true })
        .order('id', { ascending: true });
      break;

    default:
      request = request
        .order('artist', { ascending: true })
        .order('title', { ascending: true })
        .order('id', { ascending: true });
      break;
  }

  request = request.range(
    offset,
    offset + limit - 1
  );

  const { data, error, count } =
    await request;

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
    songs: (data ?? []) as SongSearchResult[],
    total: count ?? 0,
  };
}

export async function getSong(
  id: string
): Promise<Song | null> {
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

export async function listArtists(
  query = '',
  limit = 50,
  offset = 0
): Promise<ArtistSummary[]> {
  const supabase = await createClient();

  const { data, error } =
    await supabase.rpc(
      'dlrc_list_artists',
      {
        p_query: query.trim() || null,
        p_limit: limit,
        p_offset: offset,
      }
    );

  if (error) {
    console.error(
      'listArtists:',
      error
    );

    throw new Error(
      'Unable to load artists.'
    );
  }

  return (data ?? []).map(
    (artist: {
      artist: string;
      song_count: number | string;
    }) => ({
      artist: artist.artist,
      song_count: Number(
        artist.song_count
      ),
    })
  );
}

export async function listAlbums(
  query = '',
  limit = 50,
  offset = 0
): Promise<AlbumSummary[]> {
  const supabase = await createClient();

  const { data, error } =
    await supabase.rpc(
      'dlrc_list_albums',
      {
        p_query: query.trim() || null,
        p_limit: limit,
        p_offset: offset,
      }
    );

  if (error) {
    console.error(
      'listAlbums:',
      error
    );

    throw new Error(
      'Unable to load albums.'
    );
  }

  return (data ?? []).map(
    (album: {
      artist: string;
      album: string;
      song_count: number | string;
    }) => ({
      artist: album.artist,
      album: album.album,
      song_count: Number(
        album.song_count
      ),
    })
  );
}

export async function getArtistSongs(
  artist: string
): Promise<Song[]> {
  const supabase = await createClient();

  const { data, error } =
    await supabase.rpc(
      'dlrc_get_artist_songs',
      {
        p_artist: artist,
      }
    );

  if (error) {
    console.error(
      'getArtistSongs:',
      error
    );

    throw new Error(
      'Unable to load artist songs.'
    );
  }

  return (data ?? []) as Song[];
}

export async function getAlbumSongs(
  artist: string,
  album: string
): Promise<Song[]> {
  const supabase = await createClient();

  const { data, error } =
    await supabase.rpc(
      'dlrc_get_album_songs',
      {
        p_artist: artist,
        p_album: album,
      }
    );

  if (error) {
    console.error(
      'getAlbumSongs:',
      error
    );

    throw new Error(
      'Unable to load album songs.'
    );
  }

  return (data ?? []) as Song[];
}