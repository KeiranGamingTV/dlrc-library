'use client';

import {
  FormEvent,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

type SearchFormProps = {
  initialQuery?: string;
  initialArtist?: string;
  initialAlbum?: string;
  initialYear?: string;
  initialSort?: string;
};

export function SearchForm({
  initialQuery = '',
  initialArtist = '',
  initialAlbum = '',
  initialYear = '',
  initialSort = 'relevance',
}: SearchFormProps) {
  const [query, setQuery] =
    useState(initialQuery);

  const [artist, setArtist] =
    useState(initialArtist);

  const [album, setAlbum] =
    useState(initialAlbum);

  const [year, setYear] =
    useState(initialYear);

  const [sort, setSort] =
    useState(initialSort);

  const router = useRouter();

  function submit(e: FormEvent) {
    e.preventDefault();

    const params =
      new URLSearchParams();

    const cleanQuery =
      query.trim();

    const cleanArtist =
      artist.trim();

    const cleanAlbum =
      album.trim();

    const cleanYear =
      year.trim();

    if (cleanQuery) {
      params.set('q', cleanQuery);
    }

    if (cleanArtist) {
      params.set('artist', cleanArtist);
    }

    if (cleanAlbum) {
      params.set('album', cleanAlbum);
    }

    if (cleanYear) {
      params.set('year', cleanYear);
    }

    if (
      sort &&
      sort !== 'relevance'
    ) {
      params.set('sort', sort);
    }

    router.push(
      params.toString()
        ? `/search?${params.toString()}`
        : '/search'
    );
  }

  return (
    <form
      className="advanced-search"
      onSubmit={submit}
    >
      <div className="search">
        <input
          className="input"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Search by song, artist, or album…"
          aria-label="Search"
        />

        <button
          className="btn btn-primary"
          type="submit"
        >
          Search
        </button>
      </div>

      <div className="search-filters">
        <input
          className="input"
          value={artist}
          onChange={(e) =>
            setArtist(e.target.value)
          }
          placeholder="Artist"
          aria-label="Filter by artist"
        />

        <input
          className="input"
          value={album}
          onChange={(e) =>
            setAlbum(e.target.value)
          }
          placeholder="Album"
          aria-label="Filter by album"
        />

        <input
          className="input"
          value={year}
          onChange={(e) =>
            setYear(e.target.value)
          }
          placeholder="Year"
          inputMode="numeric"
          aria-label="Filter by year"
        />

        <select
          className="select"
          value={sort}
          onChange={(e) =>
            setSort(e.target.value)
          }
          aria-label="Sort results"
        >
          <option value="relevance">
            Default
          </option>
          <option value="title">
            Title
          </option>
          <option value="artist">
            Artist
          </option>
          <option value="year">
            Newest year
          </option>
        </select>
      </div>
    </form>
  );
}