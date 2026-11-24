"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api-client";

type Profile = { id: string; username: string; displayName: string };
const primary = [
  ["/chat", "◫", "Messages"],
  ["/people", "⌕", "Find people"],
  ["/contacts", "♧", "Connections"],
  ["/requests", "↗", "Requests"],
] as const;
const secondary = [
  ["/meetings", "▣", "Meetings"],
  ["/calls", "◉", "Calls"],
  ["/files", "▤", "Files"],
  ["/communities", "◎", "Communities"],
  ["/projects", "▦", "Projects"],
  ["/calendar", "▦", "Calendar"],
  ["/settings", "⚙", "Settings"],
] as const;

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      try {
        let result: { user: Profile };
        try {
          result = await apiRequest<{ user: Profile }>("/auth/me");
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes("401")) throw error;
          const refreshed = await apiRequest<{ accessToken: string }>("/auth/refresh", { method: "POST" });
          sessionStorage.setItem("midtalk_access_token", refreshed.accessToken);
          result = await apiRequest<{ user: Profile }>("/auth/me");
        }
        if (alive) setProfile(result.user);
      } catch {
        if (alive) router.replace("/login");
      } finally {
        if (alive) setAuthReady(true);
      }
    }
    loadProfile();
    return () => { alive = false; };
  }, [router]);

  async function logout() {
    try { await apiRequest<void>("/auth/logout", { method: "POST" }); }
    finally {
      sessionStorage.removeItem("midtalk_access_token");
      router.replace("/login");
    }
  }

  const renderLinks = (items: ReadonlyArray<readonly [string, string, string]>) => items.map(([href, icon, label]) => (
    <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-item ${pathname === href || (href !== "/chat" && pathname.startsWith(`${href}/`)) ? "selected" : ""}`}>
      <span className="nav-glyph" aria-hidden="true">{icon}</span><span>{label}</span>
    </Link>
  ));

  const nativeRoutes = ["/people", "/contacts", "/requests"] as const;
  if (!nativeRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) return <>{children}</>;

  if (!authReady) return <main className="workspace-loading"><span className="loading-mark">M</span><p>Opening your workspace…</p></main>;

  return <div className="app-shell">
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row"><Link href="/chat" className="brand-lockup"><img src="/midtalk-symbol.png" alt="" /><span><b>MidTalk</b><small>Private Collaboration</small></span></Link><button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">×</button></div>
      <button className="workspace-switch"><span className="workspace-avatar">M</span><span className="workspace-copy"><b>Personal workspace</b><small>Free plan</small></span><span className="switch-caret">⌄</span></button>
      <div className="side-label">WORKSPACE</div><nav className="main-nav">{renderLinks(primary)}</nav>
      <div className="side-label side-label-spaced">COLLABORATE</div><nav className="main-nav">{renderLinks(secondary)}</nav>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-spark">✦</div><b>Work better together</b><p>Keep your conversations and projects connected in one workspace.</p></div>
        <button className="user-mini" onClick={() => setMenuOpen(v => !v)}><span className="avatar" style={{ background: "#e9e6ff" }}>{(profile?.displayName || profile?.username || "M").slice(0, 1).toUpperCase()}</span><span><b>{profile?.displayName || profile?.username || "MidTalk user"}</b><small>@{profile?.username || "account"}</small></span><span>⌄</span></button>
        {menuOpen && <div className="profile-popover"><b>{profile?.displayName || profile?.username}</b><span>@{profile?.username}</span><Link href="/settings" onClick={() => setMenuOpen(false)}>Account settings</Link><button onClick={logout}>Sign out</button></div>}
      </div>
    </aside>
    <section className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-btn" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button><div className="breadcrumbs"><span>Workspace</span><span>›</span><strong>{[...primary, ...secondary].find(x => x[0] === pathname)?.[2] || "Workspace"}</strong></div></div><div className="topbar-actions"><span className="workspace-status"><i /> All systems operational</span><button className="help-btn" aria-label="Help">?</button></div></header><main className="route-content">{children}</main></section>
  </div>;
}
