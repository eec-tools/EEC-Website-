"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, List, Undo2, AlertTriangle } from "lucide-react";
import { Button, ChannelBadge, StatusPill, Empty, STATUS, CHANNELS, fmtLocal, localDateTime } from "./shared";
import { RequestChangeBox } from "./RequestChange";
import { issuesOf } from "./ApprovePage";

// Plan, Queue and Posted in one place: the same posts as a calendar or a list, filtered by status.
const FILTERS = [
  ["all", "All", () => true],
  ["waiting", "Waiting", (p) => ["pending", "changes_requested"].includes(p.status)],
  ["approved", "Approved", (p) => ["approved", "scheduled", "posting"].includes(p.status)],
  ["posted", "Posted", (p) => p.status === "posted"],
  ["failed", "Failed or missed", (p) => ["failed", "missed"].includes(p.status)],
  ["dropped", "Dropped", (p) => p.status === "dropped"],
];
const LEGEND = [
  ["Waiting", STATUS.pending.dot],
  ["Changing", STATUS.changes_requested.dot],
  ["Approved", STATUS.approved.dot],
  ["Posted", STATUS.posted.dot],
  ["Failed", STATUS.failed.dot],
];

function dot(status) {
  return (STATUS[status] || {}).dot || "bg-slate-300";
}

export default function PostsPage({ data, me, tz, view, setView, filter, setFilter, onOpenPost, onChanged, onEarlier, earlierLoaded }) {
  const [channel, setChannel] = useState("all");
  const [dayChange, setDayChange] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const f = (FILTERS.find((x) => x[0] === filter) || FILTERS[0])[2];
  const posts = useMemo(
    () => data.posts.filter((p) => (filter === "dropped" ? true : p.status !== "dropped")).filter(f).filter((p) => channel === "all" || p.channel === channel),
    [data, filter, channel] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const counts = Object.fromEntries(FILTERS.map(([k, , fn]) => [k, data.posts.filter((p) => (k === "dropped" ? true : p.status !== "dropped")).filter(fn).length]));
  const today = localDateTime(new Date().toISOString(), tz).date;
  const byDate = {};
  for (const p of posts) (byDate[localDateTime(p.slot_at, tz).date] = byDate[localDateTime(p.slot_at, tz).date] || []).push(p);
  for (const k of Object.keys(byDate)) byDate[k].sort((a, b) => String(a.slot_at).localeCompare(String(b.slot_at)));
  const batches = Object.fromEntries(data.batches.map((b) => [b.batch_id, b]));

  // Calendar weeks, Monday first; past weeks stay folded until asked for.
  const dates = [];
  for (let t = new Date(`${data.from}T00:00:00Z`); t < new Date(`${data.to}T00:00:00Z`); t = new Date(t.getTime() + 86400000)) dates.push(t.toISOString().slice(0, 10));
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) weeks.push(dates.slice(i, i + 7));
  const thisWeek = weeks.findIndex((w) => w.includes(today));
  const pastWeeks = thisWeek > 0 ? weeks.slice(0, thisWeek) : [];
  const shownWeeks = showPast ? weeks : weeks.slice(Math.max(0, thisWeek));

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-lg border border-[#E6EBF2] bg-white" role="group" aria-label="View">
        {[
          ["calendar", "Calendar", CalendarDays],
          ["list", "List", List],
        ].map(([k, label, Icon]) => (
          <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)} className={`inline-flex h-9 items-center gap-1.5 px-3 text-[13px] font-medium ${view === k ? "bg-[#012D76] text-white" : "text-[#44506A] hover:bg-[#F5F9FC]"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) =>
          k === "all" || counts[k] ? (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-full border px-2.5 py-1 text-[12.5px] ${filter === k ? "border-[#012D76] bg-[#012D76] text-white" : "border-[#E6EBF2] bg-white text-[#44506A] hover:border-[#C5CEDB]"}`}>
              {label} <span className="tabular-nums opacity-80">{counts[k]}</span>
            </button>
          ) : null
        )}
      </div>
      <select aria-label="Channel" className="ml-auto h-9 rounded-lg border border-[#E6EBF2] bg-white px-2 text-[13px] text-[#44506A]" value={channel} onChange={(e) => setChannel(e.target.value)}>
        <option value="all">All channels</option>
        {Object.entries(CHANNELS)
          .filter(([k, c]) => !c.retired || data.posts.some((p) => p.channel === k))
          .map(([k, c]) => (
            <option key={k} value={k}>
              {c.label}
            </option>
          ))}
      </select>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 md:p-6">
      {toolbar}

      {view === "calendar" ? (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
            {LEGEND.map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${c}`} />
                {l}
              </span>
            ))}
            {pastWeeks.length ? (
              <button type="button" onClick={() => setShowPast(!showPast)} className="ml-auto font-medium text-[#0A7FB8] hover:underline">
                {showPast ? "Hide earlier weeks" : `Show earlier weeks (${pastWeeks.length})`}
              </button>
            ) : null}
            {showPast && !earlierLoaded ? (
              <button type="button" onClick={onEarlier} className="font-medium text-[#0A7FB8] hover:underline">
                Load 8 more weeks
              </button>
            ) : null}
          </div>
          {shownWeeks.map((w) => {
            const weekBatches = [...new Set(w.flatMap((d) => (byDate[d] || []).map((p) => p.batch_id)))].map((id) => batches[id]).filter((b) => b && b.plan && (b.plan.theme || b.experiment));
            const n = w.reduce((x, d) => x + (byDate[d] || []).length, 0);
            return (
              <section key={w[0]} className="rounded-xl border border-[#E6EBF2] bg-white p-4">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[14.5px] font-semibold text-[#012D76]">
                    {w.includes(today) ? "This week" : `Week of ${fmtLocal(`${w[0]}T06:00:00Z`, tz, { hour: undefined, minute: undefined, weekday: undefined })}`}
                  </h3>
                  <span className="text-xs text-[#6B7280]">{n ? `${n} post${n === 1 ? "" : "s"}` : "Nothing planned yet"}</span>
                  {weekBatches.map((b) => (
                    <span key={b.batch_id} className="text-xs text-[#44506A]">
                      {b.plan.theme ? <b className="font-medium">{b.plan.theme}</b> : null}
                      {b.experiment ? ` · Testing: ${b.experiment}` : ""}
                    </span>
                  ))}
                </div>
                {n ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
                    {w.map((d) => (
                      <div key={d} className={`min-w-0 rounded-lg p-2 ${d === today ? "bg-[#EEF4FC] outline outline-1 outline-[#C7D8F0]" : "bg-[#F6F8FB]"} ${(byDate[d] || []).length ? "" : "hidden md:block"}`}>
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">{d === today ? "Today" : fmtLocal(`${d}T06:00:00Z`, tz, { hour: undefined, minute: undefined, month: undefined })}</div>
                        <div className="space-y-1.5">
                          {(byDate[d] || []).map((p) => (
                            <button key={p.post_id} type="button" onClick={() => onOpenPost(p)} className="block w-full rounded-md border-l-[3px] bg-white p-1.5 text-left hover:shadow-sm" style={{ borderLeftColor: (CHANNELS[p.channel] || {}).color }}>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10.5px] tabular-nums text-[#6B7280]">{localDateTime(p.slot_at, tz).time}</span>
                                <span title={(STATUS[p.status] || {}).label} className={`h-2 w-2 flex-none rounded-full ${dot(p.status)}`} />
                              </div>
                              <div className="line-clamp-2 text-[11.5px] leading-snug text-[#0F1B2D]">{p.topic}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </>
      ) : null}

      {view === "list" ? (
        posts.length ? (
          <div className="space-y-4">
            {Object.keys(byDate)
              .sort((a, b) => (filter === "posted" ? (a < b ? 1 : -1) : a < b ? -1 : 1))
              .map((d) => {
                const dayPosts = byDate[d];
                const open = dayPosts.filter((p) => ["approved", "scheduled", "failed"].includes(p.status) && !(p.status === "scheduled" && Date.parse(p.slot_at) <= Date.now()));
                return (
                  <section key={d} className="overflow-hidden rounded-xl border border-[#E6EBF2] bg-white">
                    <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF2F7] bg-[#FAFBFD] px-4 py-2">
                      <h3 className="text-[13px] font-semibold text-[#012D76]">{d === today ? "Today" : fmtLocal(`${d}T06:00:00Z`, tz, { hour: undefined, minute: undefined, weekday: "long" })}</h3>
                      <span className="text-xs text-[#6B7280]">{dayPosts.length} post{dayPosts.length === 1 ? "" : "s"}</span>
                      {canEdit && open.length ? (
                        <Button variant="ghost" className="ml-auto !min-h-0 py-1 text-xs" onClick={() => setDayChange(dayChange === d ? null : d)}>
                          <Undo2 size={13} /> Request a change for this day
                        </Button>
                      ) : null}
                    </div>
                    {dayChange === d ? (
                      <div className="border-b border-[#EEF2F7] p-3">
                        <RequestChangeBox
                          posts={open}
                          me={me}
                          tz={tz}
                          onCancel={() => setDayChange(null)}
                          onDone={() => {
                            setDayChange(null);
                            onChanged({ quiet: true });
                          }}
                        />
                      </div>
                    ) : null}
                    <ul>
                      {dayPosts.map((p) => {
                        const n = ["pending", "changes_requested"].includes(p.status) ? issuesOf(p) : 0;
                        const m = p.metrics || {};
                        return (
                          <li key={p.post_id} className="border-t border-[#EEF2F7] first:border-t-0">
                            <button type="button" onClick={() => onOpenPost(p)} className="grid w-full grid-cols-[20px_44px_1fr_auto] items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFD] md:grid-cols-[20px_44px_1fr_auto_auto]">
                              <ChannelBadge channel={p.channel} iconOnly />
                              <span className="text-[12.5px] tabular-nums text-[#6B7280]">{localDateTime(p.slot_at, tz).time}</span>
                              <span className="min-w-0">
                                <span className="block truncate text-[13.5px] text-[#0F1B2D]">{p.topic}</span>
                                {p.error && ["failed", "missed"].includes(p.status) ? <span className="block truncate text-xs text-red-700">{p.error}</span> : null}
                              </span>
                              <span className="hidden text-xs tabular-nums text-[#6B7280] md:block">
                                {p.status === "posted" && m.impressions != null ? `${Number(m.impressions).toLocaleString("en-GB")} impressions` : n ? (
                                  <span className="inline-flex items-center gap-1 text-amber-700">
                                    <AlertTriangle size={12} /> {n} to look at
                                  </span>
                                ) : null}
                              </span>
                              <StatusPill status={p.status} slotAt={p.slot_at} post={p} short />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            {filter === "posted" && !earlierLoaded ? (
              <div className="text-center">
                <Button variant="outline" onClick={onEarlier}>
                  Load 8 more weeks
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <Empty title={filter === "all" ? "No posts in this period" : `No ${(FILTERS.find((x) => x[0] === filter) || [])[1].toLowerCase()} posts`}>
            {filter === "approved" ? "Approved posts wait here until their time." : filter === "posted" ? "Published posts appear here with their results." : "Try another filter."}
          </Empty>
        )
      ) : null}
    </div>
  );
}
