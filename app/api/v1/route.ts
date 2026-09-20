import { NextResponse } from 'next/server';
import { getSong } from '@/lib/db';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const s=await getSong(id);if(!s)return NextResponse.json({error:'Not found'},{status:404});return NextResponse.json({id:s.id,title:s.title,artist:s.artist,album:s.album,duration_ms:s.duration_ms,year:s.year,dlrc_version:s.dlrc_version,verified:true,content:s.content});}
