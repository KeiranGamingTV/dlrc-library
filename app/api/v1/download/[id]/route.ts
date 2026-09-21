import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime='nodejs';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const admin = createAdminClient();

const { data: s, error: songError } = await admin
  .from('songs')
  .select('id,title,storage_path')
  .eq('id', id)
  .maybeSingle();

if (songError) {
  return NextResponse.json(
    { error: 'Unable to locate the requested file.' },
    { status: 500 }
  );
};if(!s)return NextResponse.json({error:'Not found'},{status:404});const {data:url,error}=await admin.storage.from('dlrc-files').createSignedUrl(s.storage_path,60);if(error||!url)return NextResponse.json({error:'File unavailable'},{status:500});const r=await fetch(url.signedUrl,{cache:'no-store'});if(!r.ok)return NextResponse.json({error:'File unavailable'},{status:500});const content=await r.text();const filename=`${s.title.replace(/[^a-z0-9\-_]+/gi,'_')}.dlrc`;return new NextResponse(content,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store'}});}
