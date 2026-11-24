"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api-client";
type RequestItem = { _id: string; sender?: { id:string; username:string; displayName:string }; };
export default function RequestsPage() {
  const [items,setItems]=useState<RequestItem[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [busy,setBusy]=useState<string|null>(null);
  async function load(){try{const r=await apiRequest<{items:RequestItem[]}>('/requests');setItems(r.items||[]);}catch(e){setError(e instanceof Error?e.message:'Could not load requests.');}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  async function act(id:string,action:'accept'|'reject'){setBusy(id);setError('');try{await apiRequest(`/requests/${id}/${action}`,{method:'POST'});setItems(v=>v.filter(x=>x._id!==id));}catch(e){setError(e instanceof Error?e.message:'Could not update request.');}finally{setBusy(null);}}
  return <section className="module-page"><div className="module-heading"><div><span className="eyebrow">CONNECTION ACTIVITY</span><h1>Connection requests</h1><p>Review people who have asked to connect with you.</p></div></div>
    {error&&<p className="inline-error" role="alert">{error}</p>}
    <div className="request-list">{items.map(item=><article className="request-card" key={item._id}><span className="avatar avatar-lg" style={{background:'#f1efff'}}>{(item.sender?.displayName||item.sender?.username||'?').slice(0,1).toUpperCase()}</span><div className="person-copy"><b>{item.sender?.displayName||item.sender?.username||'MidTalk user'}</b><small>@{item.sender?.username||'unknown'}</small></div><div className="request-actions"><button className="request-reject" disabled={busy===item._id} onClick={()=>act(item._id,'reject')}>Decline</button><button className="primary-btn" disabled={busy===item._id} onClick={()=>act(item._id,'accept')}>{busy===item._id?'Updating…':'Accept'}</button></div></article>)}
      {!loading&&!items.length&&<div className="empty-state"><span>↗</span><b>You’re all caught up</b><p>New connection requests will appear here.</p></div>}{loading&&<div className="empty-state"><b>Loading requests…</b></div>}</div>
  </section>;
}
