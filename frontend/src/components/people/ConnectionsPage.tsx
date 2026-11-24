"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api-client";
type User = { id: string; username: string; displayName: string; avatarUrl?: string | null };
export default function ConnectionsPage() {
  const [items, setItems] = useState<User[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { apiRequest<{items:User[]}>('/contacts').then(r=>setItems(r.items||[])).catch(e=>setError(e instanceof Error?e.message:'Could not load connections.')).finally(()=>setLoading(false)); }, []);
  return <section className="module-page"><div className="module-heading"><div><span className="eyebrow">YOUR NETWORK</span><h1>Connections</h1><p>People you have connected with on MidTalk.</p></div></div>
    {error && <p className="inline-error" role="alert">{error}</p>}
    <div className="people-grid connection-grid">{items.map(u=><article className="person-card" key={u.id}><span className="avatar avatar-lg" style={{background:'#e9f6f0'}}>{(u.displayName||u.username).slice(0,1).toUpperCase()}</span><div className="person-copy"><b>{u.displayName||u.username}</b><small>@{u.username}</small></div></article>)}
      {!loading&&!items.length&&<div className="empty-state"><span>♧</span><b>No connections yet</b><p>Find people and send a connection request to get started.</p></div>}
      {loading&&<div className="empty-state"><b>Loading connections…</b></div>}</div>
  </section>;
}
