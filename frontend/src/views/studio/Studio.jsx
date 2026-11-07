"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import StudioShell from "./StudioShell";
import TodayPage from "./TodayPage";
import ApprovePage from "./ApprovePage";
import PostsPage from "./PostsPage";
import PostDetail from "./PostDetail";
import InsightsPage from "./InsightsPage";
import ActivityPage from "./ActivityPage";
import SettingsPage from "./SettingsPage";
import { LearningTab } from "./Tabs";
import { CompetitorsTab } from "./MoreTabs";
import { OutreachTab } from "./OutreachTab";
import { AskProvider, Empty, fmtLocal } from "./shared";

// Old links (?tab=pending, plan, queue, posted, health) still land in the right place.
const ALIASES = {
  pending: ["approve"],
  plan: ["posts", "calendar", "all"],
  queue: ["posts", "list", "approved"],
  posted: ["posts", "list", "posted"],
  health: ["settings"],
};
const PAGE_KEYS = ["today", "approve", "outreach", "posts", "insights", "competitors", "learning", "activity", "settings"];

function mondayMinus(weeks) {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - (day + weeks * 7) * 86400000).toISOString().slice(0, 10);
}

function StudioInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (() => {
    const t = params.get("tab") || "today";
    if (ALIASES[t]) return { page: ALIASES[t][0], view: ALIASES[t][1] || params.get("view") || "calendar", filter: ALIASES[t][2] || params.get("filter") || "all" };
    return { page: PAGE_KEYS.includes(t) ? t : "today", view: params.get("view") || "calendar", filter: params.get("filter") || "all" };
  })();
  const [page, setPage] = useState(initial.page);
  const [view, setView] = useState(initial.view);
  const [filter, setFilter] = useState(initial.filter);
  const [me, setMe] = useState(null);
  const [denied, setDenied] = useState(null);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [from, setFrom] = useState(null);

  // quiet: right after a button press, skip the Buffer check so the page refreshes at once.
  const load = useCallback(
    async (opts) => {
      const quiet = Boolean(opts && opts.quiet);
      const q = [quiet ? "sync=0" : null, from ? `from=${from}` : null].filter(Boolean).join("&");
      try {
        const [{ data: m }, { data: o }] = await Promise.all([api.get("/studio/me"), api.get(`/studio/overview${q ? `?${q}` : ""}`)]);
        setMe(m);
        setData(o);
        setDenied(null);
      } catch (e) {
        if (e.response && e.response.status === 403) setDenied(e.response.data && e.response.data.detail);
        else setDenied("The Studio could not load. Reload the page.");
      }
    },
    [from]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Keep statuses current while the page is open: every minute, and when the tab comes back into view.
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && load({ quiet: true });
    const id = window.setInterval(tick, 60000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !document.querySelector('[role="dialog"][aria-modal="true"]:not([data-drawer])') && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (p, extra = {}) => {
    setPage(p);
    setOpen(null);
    const v = extra.view || view;
    const f = extra.filter || filter;
    if (extra.view) setView(extra.view);
    if (extra.filter) setFilter(extra.filter);
    router.replace(`/studio?tab=${p}${p === "posts" ? `&view=${v}&filter=${f}` : ""}`, { scroll: false });
  };
  const setPostsView = (v) => go("posts", { view: v });
  const setPostsFilter = (f) => go("posts", { filter: f });

  const tz = (me && me.timezone) || "Asia/Kolkata";
  const commentsFor = useMemo(() => {
    const m = {};
    for (const c of (data && data.comments) || []) (m[c.post_id] = m[c.post_id] || []).push(c);
    return m;
  }, [data]);

  if (denied) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <Empty title="No access to the Social Studio">{denied}</Empty>
      </div>
    );
  }
  if (!me || !data) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#F6F8FB]">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#012D76] text-[11px] font-bold text-[#D6B25A]">EEC</div>
          <p className="text-sm text-[#6B7280]">Loading the Studio…</p>
        </div>
      </div>
    );
  }

  const waiting = data.posts.filter((p) => ["pending", "changes_requested"].includes(p.status));
  const batch = waiting.length ? (data.batches.find((b) => b.batch_id === waiting[0].batch_id) || {}).plan : null;
  const longDate = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const HEAD = {
    today: ["Today", longDate],
    approve: ["Approve", batch && batch.theme ? batch.theme : `${waiting.length} waiting`],
    outreach: ["Outreach", "LinkedIn comments from the EEC page on buyers' posts"],
    posts: ["Posts", "Every post, as a calendar or a list"],
    insights: ["Insights", "How the posts and comments are doing"],
    competitors: ["Competitors", "What competitors post, and what EEC can learn"],
    learning: ["Learning", "Writing rules, experiments and research"],
    activity: ["Activity", "Everything the writer and the team did"],
    settings: ["Settings", "Publishing, channels, schedule and team"],
  }[page];
  const openPost = data.posts.find((p) => p.post_id === (open && open.post_id)) || open;

  return (
    <StudioShell page={page} onPage={go} me={me} data={data} tz={tz} title={HEAD[0]} subtitle={HEAD[1]} onOpenPost={setOpen}>
      {page === "today" ? <TodayPage data={data} me={me} tz={tz} onPage={go} onOpenPost={setOpen} /> : null}
      {page === "approve" ? <ApprovePage data={data} me={me} tz={tz} commentsFor={commentsFor} onChanged={load} onPage={go} /> : null}
      {page === "posts" ? (
        <PostsPage
          data={data}
          me={me}
          tz={tz}
          view={view}
          setView={setPostsView}
          filter={filter}
          setFilter={setPostsFilter}
          onOpenPost={setOpen}
          onChanged={load}
          earlierLoaded={Boolean(from)}
          onEarlier={() => setFrom(mondayMinus(9))}
        />
      ) : null}
      {page === "outreach" ? (
        <div className="mx-auto max-w-[1100px] p-4 md:p-6">
          <OutreachTab me={me} tz={tz} onChanged={() => load({ quiet: true })} />
        </div>
      ) : null}
      {page === "insights" ? <InsightsPage me={me} tz={tz} onOpenPost={setOpen} /> : null}
      {page === "competitors" ? (
        <div className="mx-auto max-w-[1300px] p-4 md:p-6">
          <CompetitorsTab me={me} tz={tz} onChanged={() => load({ quiet: true })} />
        </div>
      ) : null}
      {page === "learning" ? (
        <div className="mx-auto max-w-[1300px] p-4 md:p-6">
          <LearningTab me={me} tz={tz} onChanged={() => load({ quiet: true })} />
        </div>
      ) : null}
      {page === "activity" ? <ActivityPage tz={tz} data={data} /> : null}
      {page === "settings" ? <SettingsPage me={me} tz={tz} onChanged={load} onOpenPost={setOpen} /> : null}

      {openPost ? (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Post" data-drawer>
          <button type="button" aria-label="Close" className="absolute inset-0 cursor-default bg-[#0F1B2D]/35" onClick={() => setOpen(null)} />
          <div className="relative flex h-full w-full max-w-[1080px] flex-col overflow-y-auto bg-[#F6F8FB] shadow-2xl">
            <PostDetail key={openPost.post_id} post={openPost} me={me} tz={tz} comments={commentsFor[openPost.post_id] || []} onChanged={load} onClose={() => setOpen(null)} />
          </div>
        </div>
      ) : null}
      {data.synced_at ? <span className="sr-only">Checked with Buffer {fmtLocal(data.synced_at, tz)}</span> : null}
    </StudioShell>
  );
}

export default function Studio() {
  return (
    <ProtectedRoute>
      <AskProvider>
        <StudioInner />
      </AskProvider>
    </ProtectedRoute>
  );
}
