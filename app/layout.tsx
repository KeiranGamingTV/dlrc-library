import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'DLRC Library',
  description: 'A searchable, verified library of Duet LRC files.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="container nav-inner">
            <Link className="brand" href="/">DLRC Library</Link>
            <nav className="nav-links">
              <Link href="/api">API</Link>
              <Link href="/search">Search</Link>
              {user ? <Link href="/submit">Submit</Link> : null}
              {user ? <Link href="/account">Account</Link> : <Link href="/auth/login">Sign in</Link>}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
