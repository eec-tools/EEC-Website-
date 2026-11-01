"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCheck, RefreshCw, X } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import PostCard from "./PostCard";
import { PlanTab, InsightsTab, LearningTab, HealthTab } from "./Tabs";
import { Button, Card, Empty, call, fmtLocal } from "./shared";

const TABS = [
  ["pending", "Waiting for approval"],
  ["plan", "Plan"],
  ["queue", "Queue"],
  ["posted", "Posted"],
  ["insights", "Insights"],
  ["learning", "Learning"],
  ["health", "Health and settings"],
];

function StudioInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState(params.get("tab") || "pending");
  const [me, setMe] = useState(null);
  const [denied, setDenied] = useState(null);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: m }, { data: o }] = await Promise.all([api.get("/studio/me"), api.get("/studio/overview")]);
      setMe(m);
      setData(o);
      setDenied(null);
    } catch (e) {
      if (e.response && e.response.status === 403) setDenied(e.response.data && e.response.data.detail);
      else setDenied("The Studio could not load. Refresh the page.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const choose = (t) => {
    setTab(t);
    router.replace(`/studio?tab=${t}`, { scroll: false });
  };

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
  if (!me || !data) return <div className="py-24 text-center text-sm text-[#6B7280]">Loading the Studio…</div>;

  const waiting = data.posts.filter((p) => ["pending", "changes_requested"].includes(p.status));
  const queue = data.posts.filter((p) => ["approved", "scheduled", "posting", "failed"].includes(p.status));
  const posted = data.posts.filter((p) => ["posted", "missed"].includes(p.status)).reverse();
  const batches = Object.fromEntries(data.batches.map((b) => [b.batch_id, b]));
  const waitingByBatch = {};
  for (const p of waiting) (waitingByBatch[p.batch_id] = waitingByBatch[p.batch_id] || []).push(p);

  const card = (p, compact) => <PostCard key={`${p.post_id}-${p.version}-${p.status}`} post={p} me={me} tz={tz} comments={commentsFor[p.post_id] || []} onChanged={load} compact={compact} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A6831F]">EEC Social Engine</p>
          <h1 className="text-3xl font-bold text-[#012D76]">Social Studio</h1>
          <p className="mt-1 text-sm text-[#3A4759]">
            Signed in as {me.member.name} · <span className="font-semibold">{me.member.role}</span>
            {me.member.role === "approver" ? " · you approve what goes out" : " · you can view, comment and suggest changes"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {me.dry_run ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Dry run: nothing is sent to Buffer</span> : null}
          {!me.publishing_enabled ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">Publishing paused</span> : null}
          {me.publishing_enabled && !me.dry_run ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Live</span> : null}
          <Button variant="outline" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-[#E5EBF2]" aria-label="Studio sections">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => choose(key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === key ? "border-[#A6831F] text-[#012D76]" : "border-transparent text-[#6B7280] hover:text-[#012D76]"}`}
          >
            {label}
            {key === "pending" && waiting.length ? <span className="ml-1.5 rounded-full bg-[#A6831F] px-1.5 text-[11px] text-white">{waiting.length}</span> : null}
            {key === "queue" && queue.some((p) => p.status === "failed") ? <span className="ml-1.5 rounded-full bg-red-600 px-1.5 text-[11px] text-white">!</span> : null}
          </button>
        ))}
      </nav>

      {tab === "pending" ? (
        Object.keys(waitingByBatch).length ? (
          <div className="space-y-8">
            {Object.entries(waitingByBatch).map(([batchId, posts]) => {
              const b = batches[batchId] || {};
              const approvable = posts.filter((p) => !(p.lint || []).some((l) => l.level === "error"));
              return (
                <section key={batchId} className="space-y-3">
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="font-semibold text-[#012D76]">
                        {b.kind === "fast_lane" ? "Fast-lane post" : `Week of ${b.week_start ? fmtLocal(`${b.week_start}T06:00:00Z`, tz, { hour: undefined, minute: undefined }) : ""}`} · {posts.length} waiting
                      </div>
                      {b.plan && b.plan.theme ? <div className="text-sm text-[#3A4759]">{b.plan.theme}</div> : null}
                      {b.experiment ? <div className="text-xs text-[#6B7280]">Testing this week: {b.experiment}</div> : null}
                      {b.qa_summary && b.qa_summary.lesson ? <div className="text-xs text-[#6B7280]">Lesson from the checker: {b.qa_summary.lesson}</div> : null}
                    </div>
                    {me.member.role === "approver" ? (
                      <Button
                        disabled={busy || !approvable.length}
                        onClick={async () => {
                          if (!window.confirm(`Approve all ${approvable.length} posts in this batch that pass the rules? Each goes out at its own time.`)) return;
                          setBusy(true);
                          try {
                            const r = await call("post", `/studio/batches/${batchId}/approve`, {}, { success: "Batch approved" });
                            if (r.skipped && r.skipped.length) window.alert(`Not approved:\n${r.skipped.map((s) => `${s.post_id}: ${s.reason}`).join("\n")}`);
                          } finally {
                            setBusy(false);
                            load();
                          }
                        }}
                      >
                        <CheckCheck size={15} /> Approve all ({approvable.length})
                      </Button>
                    ) : null}
                  </Card>
                  {posts.map((p) => card(p, false))}
                </section>
              );
            })}
          </div>
        ) : (
          <Empty title="Nothing is waiting for approval">The next batch arrives on Friday. Timely posts can arrive any day.</Empty>
        )
      ) : null}

      {tab === "plan" ? <PlanTab data={data} tz={tz} onOpen={setOpen} /> : null}
      {tab === "queue" ? (queue.length ? <div className="space-y-3">{queue.map((p) => card(p, true))}</div> : <Empty title="Nothing approved yet" />) : null}
      {tab === "posted" ? (posted.length ? <div className="space-y-3">{posted.map((p) => card(p, true))}</div> : <Empty title="Nothing posted in this period" />) : null}
      {tab === "insights" ? <InsightsTab /> : null}
      {tab === "learning" ? <LearningTab me={me} tz={tz} /> : null}
      {tab === "health" ? <HealthTab me={me} tz={tz} onChanged={load} onOpen={setOpen} /> : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16" role="dialog" aria-modal="true" aria-label="Post">
          <button type="button" aria-label="Close" className="fixed inset-0 -z-10 cursor-default bg-black/40" onClick={() => setOpen(null)} />
          <div className="relative w-full max-w-5xl">
            <div className="mb-2 flex justify-end">
              <button type="button" aria-label="Close" className="rounded-full bg-white p-1.5 shadow" onClick={() => setOpen(null)}>
                <X size={18} />
              </button>
            </div>
            <PostCard
              post={data.posts.find((p) => p.post_id === open.post_id) || open}
              me={me}
              tz={tz}
              comments={commentsFor[open.post_id] || []}
              onChanged={async () => {
                await load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Studio() {
  return (
    <ProtectedRoute>
      <StudioInner />
    </ProtectedRoute>
  );
}
