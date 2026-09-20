import { NextResponse } from 'next/server';
import { searchSongs } from '@/lib/db';
export async function GET(request:Request){const q=new URL(request.url).searchParams.get('q')||'';const results=await searchSongs(q);return NextResponse.json({results:results.map(s=>({id:s.id,title:s.title,artist:s.artist,album:s.album,duration_ms:s.duration_ms,year:s.year,dlrc_version:s.dlrc_version,verified:true}))});}
