"use client";

import React, { useEffect, useState } from "react";
import { Card, CHANNELS, FORMATS, call } from "./shared";
import { FormatTable, EnquiriesPanel } from "./MoreTabs";

const PERIODS = [
  [1, "Last week"],
  [4, "4 weeks"],
  [8, "8 weeks"],
  [13, "Quarter"],
  [26, "6 months"],
];
const GROUPS = [
  ["format", "Format", "by_format_group", (k) => FORMATS[k] || (k === "other" ? "Format not set" : k)],
  ["channel", "Channel", "by_channel", (k) => (CHANNELS[k] || {}).label || k],
  ["pillar", "Category", "by_pillar", (k) => (k === "other" ? "Not set" : k)],
  ["series", "Series", "by_series", (k) => (k === "other" ? "No series" : k)],
];
const nf = (n) => Number(n || 0).toLocaleString("en-GB");

function delta(now, before, { points = false } = {}) {
  if (now == null || before == null) return null;
  if (points) {
    const d = +(now - before).toFixed(1);
    return d === 0 ? { text: "same as before", tone: "text-[#6B7280]" } : { text: `${d > 0 ? "▲" : "▼"} ${Math.abs(d)} points`, tone: d > 0 ? "text-emerald-700" : "text-red-700" };
  }
  if (!before) return now ? { text: "new this period", tone: "text-emerald-700" } : null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct > 300) return { text: `▲ up from ${nf(before)}`, tone: "text-emerald-700" };
  return pct === 0 ? { text: "same as before", tone: "text-[#6B7280]" } : { text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs before`, tone: pct > 0 ? "text-emerald-700" : "text-red-700" };
}

function Spark({ values, color = "#012D76" }) {
  if (!values || values.length < 2 || !values.some((v) => v)) return null;
  const w = 110;
  const h = 34;
  const max = Math.max(...values) || 1;
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), h - 3 - (v / max) * (h - 8)]);
  const line = pts.map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" className="flex-none">
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={color} opacity="0.1" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />
    </svg>
  );
}

function Tile({ label, value, d, spark, foot }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="text-[12.5px] text-[#6B7280]">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-[28px] font-semibold leading-tight tabular-nums text-[#0F1B2D]">{value}</div>
        {spark}
      </div>
      {d ? <div className={`text-xs font-medium ${d.tone}`}>{d.text}</div> : null}
      {foot ? <div className="text-xs text-[#6B7280]">{foot}</div> : null}
    </Card>
  );
}

function WeekChart({ weeks }) {
  const chans = ["linkedin_company", "instagram", "facebook", "linkedin_shirali"].filter((ch) => weeks.some((w) => w.by_channel[ch]));
  const max = Math.max(...weeks.map((w) => w.impressions), 0);
  const nice = max <= 0 ? 0 : Math.pow(10, Math.floor(Math.log10(max))) * Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max))));
  const ticks = nice ? [0, nice / 2, nice] : [0];
  const fill = { linkedin_company: "#0A66C2", instagram: "#C13584", facebook: "#7FB2F5", linkedin_shirali: "#5B8DC9" };
  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-semibold text-[#012D76]">Impressions by week</h3>
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-[#6B7280]">
          {chans.map((ch) => (
            <span key={ch} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: fill[ch] }} />
              {(CHANNELS[ch] || {}).label.split(" ·")[0]}
            </span>
          ))}
        </div>
      </div>
      {nice ? (
        <div className="flex gap-2">
          <div className="relative w-10 flex-none text-right text-[11px] tabular-nums text-[#6B7280]" style={{ height: 200 }}>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (t / nice) * 100}%` }}>
                {t >= 1000 ? `${+(t / 1000).toFixed(1)}k` : t}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative flex items-end gap-[6%] border-b border-[#D5DCE8] px-[2%]" style={{ height: 200 }}>
              {ticks.slice(1).map((t) => (
                <span key={t} className="absolute inset-x-0 border-t border-[#EEF2F7]" style={{ top: `${100 - (t / nice) * 100}%` }} />
              ))}
              {weeks.map((w, i) => (
                <div key={w.week} className="relative flex h-full flex-1 flex-col justify-end" title={`Week of ${w.week}: ${nf(w.impressions)} impressions from ${w.posts} post${w.posts === 1 ? "" : "s"}`}>
                  {i === weeks.length - 1 && w.impressions ? <span className="mb-1 text-center text-[11px] font-medium tabular-nums text-[#44506A]">{nf(w.impressions)}</span> : null}
                  {[...chans].reverse().map((ch) => (w.by_channel[ch] ? <div key={ch} style={{ height: `${(w.by_channel[ch] / nice) * 100}%`, background: fill[ch] }} /> : null))}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-[6%] px-[2%]">
              {weeks.map((w) => (
                <span key={w.week} className="flex-1 text-center text-[11px] text-[#6B7280]">
                  {new Date(`${w.week}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[#6B7280]">No impressions recorded in this period yet. Buffer reports them once a day after posts go live.</p>
      )}
    </Card>
  );
}

export default function InsightsPage({ me, tz }) {
  const [weeks, setWeeks] = useState(8);
  const [group, setGroup] = useState("format");
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(null);
    call("get", `/studio/insights?weeks=${weeks}`).then(setData).catch(() => setData({}));
  }, [weeks]);

  const t = (data && data.totals) || {};
  const p = (data && data.previous) || {};
  const o = (data && data.outreach) || null;
  const op = (data && data.outreach_previous) || null;
  const has = t.with_metrics > 0;
  const g = GROUPS.find((x) => x[0] === group);
  const rows = data
    ? Object.entries(data[g[2]] || {})
        .filter(([, r]) => r.posted)
        .map(([k, r]) => {
          const engaged = r.reactions + r.comments + r.shares + r.saves + r.clicks;
          return { k, label: g[3](k), ...r, per: r.posted ? Math.round(r.impressions / r.posted) : 0, rate: r.impressions ? (engaged / r.impressions) * 100 : null };
        })
        .sort((a, b) => b.per - a.per)
    : [];
  const maxPer = Math.max(...rows.map((r) => r.per), 1);

  return (
    <div className="mx-auto max-w-[1300px] space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-[#E6EBF2] bg-white" role="group" aria-label="Period">
          {PERIODS.map(([w, label]) => (
            <button key={w} type="button" aria-pressed={weeks === w} onClick={() => setWeeks(w)} className={`h-9 px-3 text-[13px] font-medium ${weeks === w ? "bg-[#012D76] text-white" : "text-[#44506A] hover:bg-[#F5F9FC]"}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#6B7280]">Buffer reports results once a day. Compared with the {weeks === 1 ? "week" : `${weeks} weeks`} before.</span>
      </div>

      {!data ? (
        <Card className="p-8 text-center text-sm text-[#6B7280]">Loading results…</Card>
      ) : (
        <>
          {!has ? (
            <div className="rounded-lg bg-[#EEF4FC] px-4 py-2.5 text-[13.5px] text-[#0B3B8C]">
              {t.posted ? `${t.posted} post${t.posted === 1 ? " was" : "s were"} published in this period, but Buffer has not reported results yet.` : "No posts were published in this period yet."} The numbers fill in once posts go live.
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Impressions" value={has ? nf(t.impressions) : "–"} d={has ? delta(t.impressions, p.impressions) : null} spark={<Spark values={(data.by_week || []).map((w) => w.impressions)} />} foot={`${t.posted || 0} post${t.posted === 1 ? "" : "s"} published`} />
            <Tile label="Engagement rate" value={has && t.engagement_rate != null ? `${t.engagement_rate.toFixed(1)}%` : "–"} d={has && p.engagement_rate != null ? delta(t.engagement_rate, p.engagement_rate, { points: true }) : null} foot="Reactions, comments, shares, saves and clicks per impression" />
            <Tile label="Enquiries from posts" value={nf(t.enquiries)} d={delta(t.enquiries, p.enquiries)} foot="Logged in the Enquiries list below" />
            <Tile label="Outreach replies" value={o ? nf(o.replies) : "–"} d={o && op ? delta(o.replies, op.replies) : null} foot={o ? `From ${o.posted} posted comment${o.posted === 1 ? "" : "s"}${o.posted ? ` (${Math.round((o.replies / o.posted) * 100)}%)` : ""}` : null} />
          </div>

          <WeekChart weeks={data.by_week || []} />

          <div className="space-y-4">
            <Card className="min-w-0 p-4 md:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h3 className="text-[15px] font-semibold text-[#012D76]">What works</h3>
                <div className="ml-auto inline-flex overflow-hidden rounded-lg border border-[#E6EBF2]" role="group" aria-label="Group by">
                  {GROUPS.map(([k, label]) => (
                    <button key={k} type="button" aria-pressed={group === k} onClick={() => setGroup(k)} className={`h-8 px-3 text-[12.5px] font-medium ${group === k ? "bg-[#012D76] text-white" : "text-[#44506A] hover:bg-[#F5F9FC]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {rows.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-[13px]">
                    <thead>
                      <tr className="border-b border-[#E6EBF2] text-right text-xs text-[#6B7280]">
                        <th className="py-2 pr-3 text-left font-medium">{g[1]}</th>
                        <th className="px-2 py-2 font-medium">Published</th>
                        <th className="px-2 py-2 font-medium">Impressions per post</th>
                        <th className="px-2 py-2 font-medium">Eng. rate</th>
                        <th className="px-2 py-2 font-medium">Saves</th>
                        <th className="py-2 pl-2 font-medium">Enquiries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.k} className="border-b border-[#EEF2F7] text-right tabular-nums text-[#0F1B2D] last:border-0">
                          <td className="py-2.5 pr-3 text-left">
                            {r.label}
                            {r.best ? <span className="block max-w-[260px] truncate text-[11.5px] text-[#6B7280]">Best: {r.best.topic}</span> : null}
                          </td>
                          <td className="px-2">{r.posted}</td>
                          <td className="px-2">
                            <span className="inline-flex items-center justify-end gap-2">
                              <span className="h-1.5 rounded-full bg-[#C9D8EF]" style={{ width: `${Math.max(4, (r.per / maxPer) * 90)}px` }} />
                              {nf(r.per)}
                            </span>
                          </td>
                          <td className="px-2">{r.rate == null ? "–" : `${r.rate.toFixed(1)}%`}</td>
                          <td className="px-2">{nf(r.saves)}</td>
                          <td className="pl-2">{nf(r.enquiries)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[#6B7280]">Nothing published in this period yet.</p>
              )}
              {data.by_format && Object.keys(data.by_format).length ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[12.5px] font-medium text-[#0A7FB8]">Formats compared per 1,000 impressions, with buyers engaged</summary>
                  <div className="mt-2">
                    <FormatTable data={data} />
                  </div>
                </details>
              ) : null}
            </Card>
            <div className="min-w-0">
              <EnquiriesPanel me={me} tz={tz} postsById={Object.fromEntries((data.posts || []).map((x) => [x.post_id, x]))} />
            </div>
          </div>
          <p className="text-xs text-[#6B7280]">Who engaged is logged on each published post (Posts, then open a post). LinkedIn does not share names or job titles with apps, so those are added by hand.</p>
        </>
      )}
    </div>
  );
}
