'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function AdminActions({id,status}:{id:string;status:string}){
 const [notes,setNotes]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const router=useRouter();
 async function act(action:'approve'|'reject'){setBusy(true);setError('');try{const r=await fetch(`/api/admin/submissions/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,notes})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');router.push('/admin');router.refresh();}catch(e){setError(e instanceof Error?e.message:'Request failed')}finally{setBusy(false)}}
 return <div className="card" style={{marginTop:20}}><h2>Review</h2><textarea className="textarea" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Verification notes or rejection reason" />{error?<div className="error" style={{marginTop:10}}>{error}</div>:null}<div className="actions" style={{marginTop:12}}><button className="btn btn-success" disabled={busy||status==='approved'} onClick={()=>act('approve')}>Verify & publish</button><button className="btn btn-danger" disabled={busy||status==='approved'} onClick={()=>act('reject')}>Reject</button></div></div>
}
