"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Home, CheckSquare, MessageCircle, CalendarDays, BarChart3, Binoculars, Lightbulb, Activity, Settings, MoreHorizontal, Search, AlertTriangle, X, ArrowUpRight } from "lucide-react";
import { Count, ChannelBadge, StatusPill, fmtLocal } from "./shared";

// The Studio's own frame: sidebar (desktop), icon rail (tablet), bottom bar (phone), top bar, health banner and search.
export const PAGES = [
  { key: "today", label: "Today", icon: Home, group: null },
  { key: "approve", label: "Approve", icon: CheckSquare, group: null },
  { key: "outreach", label: "Outreach", icon: MessageCircle, group: null },
  { key: "posts", label: "Posts", icon: CalendarDays, group: "Content" },
  { key: "insights", label: "Insights", icon: BarChart3, group: "Learn" },
  { key: "competitors", label: "Competitors", icon: Binoculars, group: "Learn" },
  { key: "learning", label: "Learning", icon: Lightbulb, group: "Learn" },
  { key: "activity", label: "Activity", icon: Activity, group: "System" },
  { key: "settings", label: "Settings", icon: Settings, group: "System" },
];
const PHONE_MAIN = ["today", "approve", "outreach", "posts"];

function counts(me, data) {
  const waiting = data ? data.posts.filter((p) => ["pending", "changes_requested"].includes(p.status)).length : 0;
  const failed = data ? data.posts.filter((p) => p.status === "failed").length : 0;
  const lw = (me && me.learning_waiting) || {};
  return {
    approve: { n: waiting, mine: true, title: "Posts waiting for approval" },
    outreach: { n: (me && me.outreach_ready) || 0, mine: true, title: "Comments ready to post" },
    posts: failed ? { n: failed, mine: true, title: "Posts that could not be published", red: true } : null,
    learning: { n: lw.rules || 0, mine: false, title: "Waiting for the business team" },
    competitors: { n: lw.competitor || 0, mine: false, title: "Learnings waiting for the business team" },
  };
}

function SystemPill({ me }) {
  if (!me.publishing_enabled) return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800"><span className="h-1.5 w-1.5 rounded-full bg-red-600" />Publishing paused</span>;
  if (me.dry_run) return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800" title="Approving does not send anything to Buffer"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Dry run<span className="hidden font-normal lg:inline"> · nothing goes to Buffer</span></span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Live</span>;
}

function ago(iso, now) {
  if (!iso) return "";
  const m = Math.round((now - Date.parse(iso)) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

function SearchDialog({ data, tz, onClose, onPage, onPost }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);
  const query = q.trim().toLowerCase();
  const results = useMemo(() => {
    const pages = PAGES.filter((p) => !query || p.label.toLowerCase().includes(query)).map((p) => ({ type: "page", key: p.key, label: p.label, icon: p.icon }));
    const posts = (data ? data.posts : [])
      .filter((p) => p.status !== "dropped" && query && `${p.topic} ${p.pillar || ""} ${p.market || ""} ${p.body || ""}`.toLowerCase().includes(query))
      .slice(0, 12)
      .map((p) => ({ type: "post", key: p.post_id, post: p }));
    return [...posts, ...pages].slice(0, 16);
  }, [query, data]);
  useEffect(() => setI(0), [query]);
  const pick = (r) => {
    if (!r) return;
    onClose();
    if (r.type === "page") onPage(r.key);
    else onPost(r.post);
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default bg-[#0F1B2D]/40" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[#E6EBF2] px-4">
          <Search size={17} className="text-[#6B7280]" />
          <input
            ref={inputRef}
            aria-label="Search"
            className="h-12 flex-1 bg-transparent text-[15px] outline-none"
            placeholder="Search posts by topic, market or text, or jump to a page"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") (e.preventDefault(), setI(Math.min(i + 1, results.length - 1)));
              if (e.key === "ArrowUp") (e.preventDefault(), setI(Math.max(i - 1, 0)));
              if (e.key === "Enter") pick(results[i]);
            }}
          />
          <button type="button" aria-label="Close search" onClick={onClose} className="rounded p-1 text-[#6B7280] hover:bg-[#F5F9FC]">
            <X size={16} />
          </button>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {results.map((r, k) => (
            <li key={`${r.type}-${r.key}`}>
              <button type="button" onMouseEnter={() => setI(k)} onClick={() => pick(r)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${k === i ? "bg-[#F0F5FC]" : ""}`}>
                {r.type === "page" ? (
                  <>
                    <r.icon size={16} className="text-[#6B7280]" />
                    <span className="font-medium text-[#0F1B2D]">{r.label}</span>
                    <span className="ml-auto text-xs text-[#6B7280]">Page</span>
                  </>
                ) : (
                  <>
                    <ChannelBadge channel={r.post.channel} iconOnly />
                    <span className="min-w-0 flex-1 truncate text-[#0F1B2D]">{r.post.topic}</span>
                    <span className="hidden text-xs text-[#6B7280] sm:inline">{fmtLocal(r.post.slot_at, tz, { hour: undefined, minute: undefined })}</span>
                    <StatusPill status={r.post.status} slotAt={r.post.slot_at} post={r.post} short />
                  </>
                )}
              </button>
            </li>
          ))}
          {!results.length ? <li className="px-4 py-6 text-center text-sm text-[#6B7280]">No posts match &ldquo;{q}&rdquo;.</li> : null}
        </ul>
      </div>
    </div>
  );
}

export default function StudioShell({ page, onPage, me, data, tz, title, subtitle, actions, onOpenPost, children }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [now, setNow] = useState(Date.now());
  const c = counts(me, data);
  const mainRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (!typing && e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSearching(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setMoreOpen(false);
  }, [page]);

  const alerts = [...((me && me.alerts) || [])];
  if ((me.db_update_needed || []).length) alerts.unshift({ level: "error", key: "db", text: `A database update has not been run yet. Run ${me.db_migration} in Supabase (SQL editor), then reload.` });

  const groups = [];
  for (const p of PAGES) {
    const g = groups.find((x) => x.name === p.group);
    if (g) g.items.push(p);
    else groups.push({ name: p.group, items: [p] });
  }
  const navItem = (p, variant) => {
    const on = page === p.key;
    const cnt = c[p.key];
    const Icon = p.icon;
    if (variant === "rail")
      return (
        <button key={p.key} type="button" title={p.label} aria-label={p.label} aria-current={on ? "page" : undefined} onClick={() => onPage(p.key)} className={`relative flex h-11 w-11 items-center justify-center rounded-lg ${on ? "bg-white/10 text-white" : "text-[#C9D5EA] hover:bg-white/5 hover:text-white"}`}>
          <Icon size={19} strokeWidth={1.8} />
          {cnt && cnt.n ? <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ${cnt.red ? "bg-red-400" : cnt.mine ? "bg-[#D6B25A]" : "bg-white/50"}`} /> : null}
        </button>
      );
    return (
      <button
        key={p.key}
        type="button"
        aria-current={on ? "page" : undefined}
        onClick={() => onPage(p.key)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14.5px] transition ${on ? "bg-white/10 font-semibold text-white" : "text-[#D5DEF0] hover:bg-white/5 hover:text-white"}`}
      >
        <Icon size={18} strokeWidth={1.8} className="flex-none opacity-90" />
        {p.label}
        {cnt && cnt.n ? (cnt.red ? <span title={cnt.title} className="ml-auto rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-5 text-white">{cnt.n}</span> : <Count n={cnt.n} mine={cnt.mine} title={cnt.title} />) : null}
      </button>
    );
  };

  return (
    <div className="eec-studio flex h-[100dvh] bg-[#F6F8FB] text-[#0F1B2D]">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 flex-none flex-col bg-[#012D76] px-3 py-4 xl:flex">
        <div className="mb-4 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A6831F] text-[11px] font-bold tracking-wide text-[#012D76]">EEC</div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-white">Social Studio</div>
            <div className="text-[11px] text-[#8FA3C7]">Elan Exports Consultancy</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Studio">
          {groups.map((g) => (
            <div key={g.name || "main"} className="flex flex-col gap-0.5">
              {g.name ? <div className="px-3 pb-1.5 pt-4 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#8FA3C7]">{g.name}</div> : null}
              {g.items.map((p) => navItem(p))}
            </div>
          ))}
        </nav>
        <div className="mt-3 flex items-center gap-2.5 border-t border-white/10 px-2 pt-3">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#2A4F93] text-xs font-semibold text-white">{(me.member.name || me.member.email || "?").slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium text-white">{me.member.name}</div>
            <div className="text-[11.5px] capitalize text-[#8FA3C7]">{me.member.role}</div>
          </div>
          <Link href="/" title="Back to the website" className="ml-auto rounded p-1.5 text-[#8FA3C7] hover:bg-white/5 hover:text-white">
            <ArrowUpRight size={16} />
            <span className="sr-only">Back to the website</span>
          </Link>
        </div>
      </aside>

      {/* Icon rail (tablet and small laptop) */}
      <aside className="hidden w-16 flex-none flex-col items-center gap-1 bg-[#012D76] py-4 md:flex xl:hidden">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#A6831F] text-[10px] font-bold text-[#012D76]">EEC</div>
        {groups.map((g, k) => (
          <React.Fragment key={g.name || "main"}>
            {k ? <div className="my-1.5 h-px w-8 bg-white/10" /> : null}
            {g.items.map((p) => navItem(p, "rail"))}
          </React.Fragment>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex min-h-[56px] flex-none items-center gap-3 border-b border-[#E6EBF2] bg-white px-4 md:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-3">
              <h1 className="flex-none text-lg font-semibold text-[#012D76]">{title}</h1>
              {subtitle ? <span className="hidden truncate text-[13px] text-[#6B7280] lg:inline">{subtitle}</span> : null}
            </div>
          </div>
          {actions}
          <SystemPill me={me} />
          {data && data.synced_at ? <span className="hidden text-xs text-[#6B7280] 2xl:inline" title={`Checked with Buffer ${fmtLocal(data.synced_at, tz)}`}>Updated {ago(data.synced_at, now)}</span> : null}
          <button type="button" onClick={() => setSearching(true)} className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-[#E6EBF2] bg-[#F6F8FB] px-3 text-left text-[13px] text-[#6B7280] hover:border-[#D5DCE8] lg:flex">
            <Search size={15} /> Search posts
            <kbd className="ml-auto rounded border border-b-2 border-[#D5DCE8] bg-white px-1 text-[10.5px]">/</kbd>
          </button>
          <button type="button" aria-label="Search" onClick={() => setSearching(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#44506A] hover:bg-[#F5F9FC] lg:hidden">
            <Search size={18} />
          </button>
        </header>

        {alerts.length ? (
          <div className="flex-none space-y-px">
            {alerts.map((a) => (
              <div key={a.key} role="alert" className={`flex items-center gap-3 px-4 py-2 text-sm md:px-6 ${a.level === "error" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
                <AlertTriangle size={16} className="flex-none" />
                <span className="min-w-0 flex-1">{a.text}</span>
                {page !== "settings" && a.key !== "db" ? (
                  <button type="button" onClick={() => onPage("settings")} className={`flex-none rounded-md border px-2.5 py-1 text-xs font-semibold ${a.level === "error" ? "border-red-200 bg-white hover:bg-red-50" : "border-amber-200 bg-white hover:bg-amber-50"}`}>
                    {a.key === "failed" ? "See them" : "Open settings"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom bar (phone) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#E6EBF2] bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Studio">
        {PAGES.filter((p) => PHONE_MAIN.includes(p.key)).map((p) => {
          const on = page === p.key;
          const cnt = c[p.key];
          const Icon = p.icon;
          return (
            <button key={p.key} type="button" aria-current={on ? "page" : undefined} onClick={() => onPage(p.key)} className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "font-semibold text-[#012D76]" : "text-[#6B7280]"}`}>
              <Icon size={21} strokeWidth={1.8} />
              {p.label}
              {cnt && cnt.n ? <span className={`absolute left-1/2 top-2 ml-1.5 rounded-full px-1.5 text-[10px] font-semibold leading-4 text-white ${cnt.red ? "bg-red-600" : cnt.mine ? "bg-[#A6831F]" : "bg-slate-400"}`}>{cnt.n}</span> : null}
            </button>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] ${!PHONE_MAIN.includes(page) ? "font-semibold text-[#012D76]" : "text-[#6B7280]"}`}>
          <MoreHorizontal size={21} strokeWidth={1.8} />
          More
        </button>
      </nav>
      {moreOpen ? (
        <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-label="More pages">
          <button type="button" aria-label="Close" className="absolute inset-0 cursor-default bg-[#0F1B2D]/30" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-16 rounded-t-2xl bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl">
            {PAGES.filter((p) => !PHONE_MAIN.includes(p.key)).map((p) => {
              const cnt = c[p.key];
              const Icon = p.icon;
              return (
                <button key={p.key} type="button" onClick={() => onPage(p.key)} className={`flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] ${page === p.key ? "bg-[#F0F5FC] font-semibold text-[#012D76]" : "text-[#0F1B2D]"}`}>
                  <Icon size={19} strokeWidth={1.8} className="text-[#44506A]" />
                  {p.label}
                  {cnt && cnt.n ? <span className="ml-auto rounded-full bg-slate-200 px-2 text-xs font-semibold leading-5 text-slate-700">{cnt.n}</span> : null}
                </button>
              );
            })}
            <Link href="/" className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] text-[#44506A]">
              <ArrowUpRight size={19} strokeWidth={1.8} /> Back to the website
            </Link>
          </div>
        </div>
      ) : null}

      {searching ? <SearchDialog data={data} tz={tz} onClose={() => setSearching(false)} onPage={onPage} onPost={onOpenPost} /> : null}
    </div>
  );
}
