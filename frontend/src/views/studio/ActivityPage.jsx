"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card, call, fmtLocal, localDateTime } from "./shared";
import { describe, kindOf } from "./activityText";

const WHO = [
  ["all", "Everyone"],
  ["writer", "Writer"],
  ["team", "Team"],
  ["studio", "Studio"],
];
const TYPES = [
  ["all", "Everything"],
  ["writer", "Writer's jobs"],
  ["posts", "Posts"],
  ["outreach", "Outreach"],
  ["learning", "Learning"],
  ["competitors", "Competitors"],
  ["settings", "Settings and team"],
  ["email", "Emails"],
];

export default function ActivityPage({ tz, data }) {
  const [days, setDays] = useState(7);
  const [who, setWho] = useState("all");
  const [type, setType] = useState("all");
  const [rows, setRows] = useState(null);
  useEffect(() => {
    setRows(null);
    call("get", `/studio/activity?all=1&days=${days}`).then(setRows).catch(() => setRows([]));
  }, [days]);
  const topics = Object.fromEntries(((data && data.posts) || []).map((p) => [p.post_id, p.topic]));
  const whoOf = (r) => (r.actor === "claude" ? "writer" : r.actor === "system" ? "studio" : "team");
  const shown = (rows || []).filter((r) => (who === "all" || whoOf(r) === who) && (type === "all" || kindOf(r.action) === type));
  const groups = [];
  for (const r of shown) {
    const d = localDateTime(r.at, tz).date;
    const g = groups.find((x) => x.d === d);
    if (g) g.items.push(r);
    else groups.push({ d, items: [r] });
  }
  const sel = "h-9 rounded-lg border border-[#E6EBF2] bg-white px-2 text-[13px] text-[#44506A]";

  return (
    <div className="mx-auto max-w-[900px] space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Who" className={sel} value={who} onChange={(e) => setWho(e.target.value)}>
          {WHO.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="What" className={sel} value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Period" className={sel} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[
            [7, "Last 7 days"],
            [30, "Last 30 days"],
            [90, "Last 90 days"],
          ].map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-[#6B7280]">{rows ? `${shown.length} event${shown.length === 1 ? "" : "s"}` : ""}</span>
      </div>
      {rows === null ? (
        <Card className="p-8 text-center text-sm text-[#6B7280]">Loading…</Card>
      ) : groups.length ? (
        groups.map((g) => (
          <section key={g.d}>
            <h3 className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">{fmtLocal(`${g.d}T06:00:00Z`, tz, { hour: undefined, minute: undefined, weekday: "long", month: "long" })}</h3>
            <Card className="px-4 py-1">
              <ul>
                {g.items.map((r) => {
                  const x = describe(r, { postTopic: (id) => topics[id] });
                  const srcs = (x.sources || []).filter((s) => s && s.url);
                  return (
                    <li key={r.id || `${r.at}-${r.action}`} className="grid grid-cols-[28px_1fr_auto] gap-3 border-t border-[#EEF2F7] py-2.5 text-[13.5px] leading-snug first:border-t-0">
                      <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${x.who === "Writer" ? "bg-[#F6EFDC] text-[#8A6A16]" : x.who === "Studio" ? "bg-slate-100 text-slate-600" : "bg-[#E7EDF8] text-[#012D76]"}`}>{x.who.slice(0, 1)}</span>
                      <div className="min-w-0">
                        <b className="font-semibold">{x.who}</b> {x.text}
                        {x.detail ? <div className="mt-0.5 text-[12.5px] text-[#6B7280]">{x.detail}</div> : null}
                        {srcs.length ? (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-[12px] font-medium text-[#0A7FB8]">
                              {srcs.length} source{srcs.length === 1 ? "" : "s"} used
                            </summary>
                            <ul className="mt-1 space-y-1">
                              {srcs.map((s, k) => (
                                <li key={k} className="text-[12.5px] text-[#44506A]">
                                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#0A7FB8] hover:underline">
                                    {s.title || s.url} <ExternalLink size={11} />
                                  </a>
                                  {s.date ? ` · ${s.date}` : ""}
                                  {s.used_for ? <span className="text-[#6B7280]"> · {s.used_for}</span> : null}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </div>
                      <time className="whitespace-nowrap text-[12px] tabular-nums text-[#6B7280]">{localDateTime(r.at, tz).time}</time>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        ))
      ) : (
        <Card className="p-8 text-center text-sm text-[#6B7280]">Nothing matches in this period.</Card>
      )}
    </div>
  );
}
