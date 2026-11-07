"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCheck, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import PostDetail from "./PostDetail";
import { Button, ChannelBadge, StatusPill, Empty, call, fmtLocal, localDateTime, useAsk, CHANNELS } from "./shared";

// What needs a look before approving: broken rules, the writer's warnings, facts not confirmed, a change that failed.
export function issuesOf(p) {
  const lint = p.lint || [];
  const n =
    lint.filter((l) => l.level === "error" || l.level === "warn").length +
    (p.verify_flags && p.verify_flags !== "None" ? 1 : 0) +
    (p.claims || []).filter((c) => c.verdict && c.verdict !== "confirmed").length +
    (p.change_request && p.change_request.state === "failed" ? 1 : 0);
  return n;
}
const ready = (p) => p.status === "pending" && !issuesOf(p) && !(p.lint || []).some((l) => l.level === "error");

export default function ApprovePage({ data, me, tz, commentsFor, onChanged, onPage }) {
  const ask = useAsk();
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(null);
  const [phoneDetail, setPhoneDetail] = useState(false);
  const [busy, setBusy] = useState(false);
  const isApprover = me.member.role === "approver";

  const waiting = useMemo(() => data.posts.filter((p) => ["pending", "changes_requested"].includes(p.status)).sort((a, b) => String(a.slot_at).localeCompare(String(b.slot_at))), [data]);
  const channels = [...new Set(waiting.map((p) => p.channel))];
  const shown = waiting.filter((p) => (filter === "all" ? true : filter === "look" ? issuesOf(p) > 0 : p.channel === filter));
  const readyPosts = waiting.filter(ready);
  const batches = Object.fromEntries(data.batches.map((b) => [b.batch_id, b]));
  const themes = [...new Set(waiting.map((p) => p.batch_id))].map((id) => batches[id]).filter((b) => b && b.plan && b.plan.theme);

  // Keep a post selected: the same one if it is still waiting, otherwise the one now in its place.
  const [lastIndex, setLastIndex] = useState(0);
  const selected = shown.find((p) => p.post_id === sel) || shown[Math.min(lastIndex, shown.length - 1)] || null;
  useEffect(() => {
    if (selected) {
      setSel(selected.post_id);
      setLastIndex(shown.findIndex((p) => p.post_id === selected.post_id));
    }
  }, [selected && selected.post_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (d) => {
    if (!shown.length) return;
    const i = Math.max(0, Math.min(shown.length - 1, shown.findIndex((p) => p.post_id === (selected && selected.post_id)) + d));
    setSel(shown[i].post_id);
    setLastIndex(i);
    const el = document.getElementById(`row-${shown[i].post_id}`);
    if (el) el.scrollIntoView({ block: "nearest" });
  };
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "j" || e.key === "ArrowDown") (e.preventDefault(), move(1));
      if (e.key === "k" || e.key === "ArrowUp") (e.preventDefault(), move(-1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const approveReady = async () => {
    const list = readyPosts;
    if (!list.length) return;
    const ok = await ask({ title: `Approve ${list.length} post${list.length === 1 ? "" : "s"}?`, body: `Only posts that passed every check: ${list.map((p) => `\n• ${fmtLocal(p.slot_at, tz)} · ${p.topic}`).join("")}\n\nEach goes out at its own time.`, confirm: `Approve ${list.length}` });
    if (!ok) return;
    setBusy(true);
    let done = 0;
    const failed = [];
    for (const p of list) {
      try {
        await call("post", `/studio/posts/${p.post_id}/approve`, {});
        done += 1;
      } catch {
        failed.push(p.topic);
      }
    }
    setBusy(false);
    if (done) toast.success(`${done} approved${me.dry_run ? ". Dry run is on, so nothing was sent to Buffer." : "."}`);
    if (failed.length) toast.error(`Not approved: ${failed.join("; ")}`);
    onChanged({ quiet: true });
  };

  if (!waiting.length) {
    const next = data.posts.filter((p) => ["approved", "scheduled"].includes(p.status) && Date.parse(p.slot_at) > Date.now()).sort((a, b) => String(a.slot_at).localeCompare(String(b.slot_at)))[0];
    return (
      <div className="p-4 md:p-6">
        <Empty
          title="Nothing is waiting for approval"
          action={
            <Button variant="outline" onClick={() => onPage("posts")}>
              See the calendar
            </Button>
          }
        >
          The writer plans next week every Friday; timely posts can arrive on any day.{next ? ` Next post out: ${fmtLocal(next.slot_at, tz)}, ${next.topic}.` : ""}
        </Empty>
      </div>
    );
  }

  const days = [];
  for (const p of shown) {
    const d = localDateTime(p.slot_at, tz).date;
    const g = days.find((x) => x.d === d);
    if (g) g.items.push(p);
    else days.push({ d, label: fmtLocal(p.slot_at, tz, { hour: undefined, minute: undefined, weekday: "long", month: "short" }), items: [p] });
  }
  const chip = (key, label, n) => (
    <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key} className={`rounded-full border px-2.5 py-1 text-[12.5px] ${filter === key ? "border-[#012D76] bg-[#012D76] text-white" : "border-[#E6EBF2] bg-white text-[#44506A] hover:border-[#C5CEDB]"}`}>
      {label} <span className="tabular-nums opacity-80">{n}</span>
    </button>
  );
  const idx = selected ? shown.findIndex((p) => p.post_id === selected.post_id) : -1;

  return (
    <div className="flex h-full min-h-0">
      {/* List */}
      <div className={`flex w-full flex-none flex-col border-r border-[#E6EBF2] bg-white lg:w-[360px] xl:w-[380px] ${phoneDetail ? "hidden lg:flex" : "flex"}`}>
        <div className="space-y-3 border-b border-[#E6EBF2] p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-[#012D76]">{waiting.length} waiting</div>
              <div className="text-[12.5px] text-[#6B7280]">First goes out {fmtLocal(waiting[0].slot_at, tz)}</div>
            </div>
            {isApprover && readyPosts.length ? (
              <Button disabled={busy} onClick={approveReady} title="Approves only posts that passed every check">
                <CheckCheck size={15} /> Approve {readyPosts.length} ready
              </Button>
            ) : null}
          </div>
          {themes.length ? (
            <details className="text-[12.5px] text-[#44506A]">
              <summary className="cursor-pointer text-[#6B7280]">This week&apos;s plan</summary>
              {themes.map((b) => (
                <div key={b.batch_id} className="mt-1.5 space-y-0.5">
                  <div className="font-medium text-[#0F1B2D]">{b.plan.theme}</div>
                  {b.experiment ? <div>Testing: {b.experiment}</div> : null}
                  {b.qa_summary && b.qa_summary.lesson ? <div>Checker&apos;s lesson: {b.qa_summary.lesson}</div> : null}
                </div>
              ))}
            </details>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {chip("all", "All", waiting.length)}
            {chip("look", "Needs a look", waiting.filter((p) => issuesOf(p)).length)}
            {channels.length > 1 ? channels.map((ch) => chip(ch, (CHANNELS[ch] || {}).label ? CHANNELS[ch].label.split(" ·")[0] : ch, waiting.filter((p) => p.channel === ch).length)) : null}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          {days.map((g) => (
            <div key={g.d}>
              <div className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">{g.label}</div>
              {g.items.map((p) => {
                const n = issuesOf(p);
                const on = selected && selected.post_id === p.post_id;
                return (
                  <button
                    key={p.post_id}
                    id={`row-${p.post_id}`}
                    type="button"
                    aria-current={on ? "true" : undefined}
                    onClick={() => {
                      setSel(p.post_id);
                      setLastIndex(shown.findIndex((x) => x.post_id === p.post_id));
                      setPhoneDetail(true);
                    }}
                    className={`grid w-full grid-cols-[20px_1fr_auto] items-start gap-2.5 border-l-[3px] px-4 py-3 text-left ${on ? "border-[#012D76] bg-[#F0F5FC]" : "border-transparent hover:bg-[#F8FAFD]"}`}
                  >
                    <ChannelBadge channel={p.channel} iconOnly />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-[13.5px] font-medium leading-snug text-[#0F1B2D]">{p.topic}</span>
                      <span className="mt-1 flex items-center gap-2 text-[12px] text-[#6B7280]">
                        <span className="tabular-nums">{localDateTime(p.slot_at, tz).time}</span>
                        {n ? (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle size={12} /> {n} to look at
                          </span>
                        ) : p.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 size={12} /> all checks passed
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <StatusPill status={p.status} slotAt={p.slot_at} post={p} short />
                  </button>
                );
              })}
            </div>
          ))}
          {!shown.length ? <p className="px-4 py-6 text-sm text-[#6B7280]">Nothing matches this filter.</p> : null}
        </div>
      </div>

      {/* Detail */}
      <div className={`min-w-0 flex-1 flex-col overflow-y-auto ${phoneDetail ? "flex" : "hidden lg:flex"}`}>
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b border-[#E6EBF2] bg-white px-2 py-1.5 lg:hidden">
              <button type="button" onClick={() => setPhoneDetail(false)} className="flex h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-[#012D76]">
                <ChevronLeft size={18} /> All {shown.length}
              </button>
              <span className="ml-auto text-[13px] tabular-nums text-[#6B7280]">
                {idx + 1} of {shown.length}
              </span>
              <button type="button" aria-label="Previous post" disabled={idx <= 0} onClick={() => move(-1)} className="flex h-10 w-10 items-center justify-center rounded-md text-[#012D76] disabled:opacity-30">
                <ChevronLeft size={20} />
              </button>
              <button type="button" aria-label="Next post" disabled={idx >= shown.length - 1} onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-md text-[#012D76] disabled:opacity-30">
                <ChevronRight size={20} />
              </button>
            </div>
            <PostDetail key={selected.post_id} post={selected} me={me} tz={tz} comments={commentsFor[selected.post_id] || []} onChanged={onChanged} shortcuts />
          </>
        ) : (
          <div className="p-6 text-sm text-[#6B7280]">Pick a post on the left.</div>
        )}
      </div>
    </div>
  );
}
