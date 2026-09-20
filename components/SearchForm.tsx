'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchForm({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  function submit(e: FormEvent) {
    e.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  }
  return <form className="search" onSubmit={submit}>
    <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by song, artist, or album…" aria-label="Search" />
    <button className="btn btn-primary" type="submit">Search</button>
  </form>;
}
