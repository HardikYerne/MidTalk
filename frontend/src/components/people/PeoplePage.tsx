"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "../../services/api-client";

type User = { id: string; username: string; displayName: string; avatarUrl?: string | null; bio?: string };
type SearchResponse = { items: User[] };

export default function PeoplePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  async function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) { setError("Enter at least 2 characters to search usernames."); return; }
    setLoading(true); setError("");
    try {
      const data = await apiRequest<SearchResponse>(`/users/search?q=${encodeURIComponent(value)}`);
      setResults(data.items || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not search users."); }
    finally { setLoading(false); }
  }

  async function connect(user: User) {
    setError("");
    try {
      await apiRequest("/conversations/direct", { method: "POST", body: JSON.stringify({ userId: user.id }) });
      setSent(current => [...current, user.id]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the request."); }
  }

  return <section className="module-page people-page">
    <div className="module-heading"><div><span className="eyebrow">GROW YOUR NETWORK</span><h1>Find people</h1><p>Discover people on MidTalk by their username and start a connection.</p></div></div>
    <form className="people-search" onSubmit={search}><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by username…" aria-label="Search by username"/><button className="primary-btn" disabled={loading}>{loading ? "Searching…" : "Search people"}</button></form>
    {error && <p className="inline-error" role="alert">{error}</p>}
    <div className="people-results-heading"><div><b>Search results</b><small>{results.length ? `${results.length} people found` : "Results will appear here"}</small></div></div>
    <div className="people-grid">
      {results.map(user => <article className="person-card" key={user.id}><span className="avatar avatar-lg" style={{ background: "#eeeaff" }}>{(user.displayName || user.username).slice(0, 1).toUpperCase()}</span><div className="person-copy"><b>{user.displayName || user.username}</b><small>@{user.username}</small>{user.bio && <p>{user.bio}</p>}</div><button className="person-connect" disabled={sent.includes(user.id)} onClick={() => connect(user)}>{sent.includes(user.id) ? "Request sent" : "Connect +"}</button></article>)}
      {!results.length && <div className="empty-state"><span>⌕</span><b>Find your people on MidTalk</b><p>Search for a username to see matching accounts.</p></div>}
    </div>
    <p className="people-note">Search currently matches usernames. Email and display-name search are not provided by the connected API endpoint.</p>
  </section>;
}
