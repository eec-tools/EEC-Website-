"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, StatusPill, call, fmtLocal, localDateTime, CHANNELS } from "./shared";
import { issuesOf } from "./ApprovePage";
import { describe } from "./activityText";

function greeting(tz) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Task({ label, n, title, children, cta, onClick, urgent }) {
  const done = !n;
  return (
    <div className={`flex flex-col gap-2 rounded-xl border bg-white p-5 ${urgent && !done ? "border-[#E9CF8F] shadow-[inset_4px_0_0_#A6831F]" : "border-[#E6EBF2]"}`}>
      <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#6B7280]">{label}</div>
      {done ? (
        <div className="flex items-center gap-2 py-1 text-[15px] font-medium text-emerald-700">
          <CheckCircle2 size={18} /> Nothing waiting
        </div>
      ) : (
        <>
          <div className="text-[34px] font-semibold leading-none tabular-nums text-[#012D76]">{n}</div>
          <div className="text-[15px] font-semibold text-[#0F1B2D]">{title}</div>
        </>
      )}
      <div className="text-[13.5px] leading-relaxed text-[#6B7280]">{children}</div>
      <div className="mt-auto pt-1">
        <Button variant={urgent && !done ? "primary" : "outline"} onClick={onClick}>
          {cta} <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

export default function TodayPage({ data, me, tz, onPage, onOpenPost }) {
  const [feed, setFeed] = useState(null);
  const [outreach, setOutreach] = useState(null);
  useEffect(() => {
    call("get", "/studio/activity?all=1&days=7").then(setFeed).catch(() => setFeed([]));
    call("get", "/studio/outreach").then(setOutreach).catch(() => setOutreach(null));
  }, [data]);

  const waiting = data.posts.filter((p) => ["pending", "changes_requested"].includes(p.status)).sort((a, b) => String(a.slot_at).localeCompare(String(b.slot_at)));
  const changing = waiting.filter((p) => p.status === "changes_requested").length;
  const look = waiting.filter((p) => p.status === "pending" && issuesOf(p)).length;
  const readyN = waiting.filter((p) => p.status === "pending" && !issuesOf(p)).length;
  const lw = me.learning_waiting || {};
  const business = (lw.rules || 0) + (lw.competitor || 0);
  const outreachReady = me.outreach_ready || 0;
  const buyers = outreach ? [...new Set(outreach.comments.filter((c) => c.status === "ready").map((c) => c.target_name))] : [];
  const needs = [waiting.length, outreachReady, business].filter(Boolean).length;
  const topics = Object.fromEntries(data.posts.map((p) => [p.post_id, p.topic]));

  // The next 7 days, today first.
  const today = localDateTime(new Date().toISOString(), tz).date;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.parse(`${today}T06:00:00Z`) + i * 86400000).toISOString().slice(0, 10);
    return { d, posts: data.posts.filter((p) => p.status !== "dropped" && localDateTime(p.slot_at, tz).date === d).sort((a, b) => String(a.slot_at).localeCompare(String(b.slot_at))) };
  });
  const first = (me.member.name || "").split(" ")[0];

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h2 className="text-[26px] font-semibold text-[#012D76] md:text-[30px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {greeting(tz)}{first ? `, ${first}` : ""}
        </h2>
        <p className="mt-1 text-[14.5px] text-[#44506A]">
          {needs ? `${needs === 1 ? "One thing needs" : `${["", "", "Two", "Three"][needs]} things need`} you.` : "Nothing needs you right now."}
          {me.writer_last_run ? ` The writer last worked ${fmtLocal(me.writer_last_run, tz)}.` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Task label="Approve" n={waiting.length} title={`post${waiting.length === 1 ? "" : "s"} waiting for ${me.member.role === "approver" ? "you" : "the approver"}`} cta="Review posts" onClick={() => onPage("approve")} urgent>
          {waiting.length ? (
            <>
              First one goes out {fmtLocal(waiting[0].slot_at, tz)}.{" "}
              {[readyN ? `${readyN} ready to approve as ${readyN === 1 ? "it is" : "they are"}` : null, look ? `${look} to look at` : null, changing ? `${changing} being changed by the writer` : null].filter(Boolean).join("; ")}.
            </>
          ) : (
            "The writer sends next week's plan every Friday."
          )}
        </Task>
        <Task label="Outreach" n={outreachReady} title={`LinkedIn comment${outreachReady === 1 ? "" : "s"} to post`} cta="Post comments" onClick={() => onPage("outreach")}>
          {outreachReady ? (
            <>
              {buyers.length ? `On posts by ${buyers.slice(0, 2).join(", ")}${buyers.length > 2 ? ` and ${buyers.length - 2} other buyer${buyers.length - 2 === 1 ? "" : "s"}` : ""}. ` : ""}About {Math.max(1, Math.round(outreachReady / 2))} minute{outreachReady > 2 ? "s" : ""} in all.
            </>
          ) : (
            "New comments arrive on Monday, Wednesday and Friday."
          )}
        </Task>
        <Task label="Business team" n={business} title={`learning${business === 1 ? "" : "s"} to decide`} cta="Decide" onClick={() => onPage(lw.rules ? "learning" : "competitors")}>
          {business ? "The writer will not use them until the team confirms them." : "Rules about what EEC says or offers wait here for the team."}
        </Task>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className="rounded-xl border border-[#E6EBF2] bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <h3 className="text-[15px] font-semibold text-[#012D76]">Next 7 days</h3>
            <div className="ml-auto flex gap-3 text-xs text-[#6B7280]">
              {["linkedin_company", "instagram", "facebook"].map((ch) => (
                <span key={ch} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHANNELS[ch].color }} />
                  {CHANNELS[ch].label.split(" ·")[0]}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
            {days.map(({ d, posts }, i) => (
              <div key={d} className={`min-w-0 rounded-lg p-2 ${i === 0 ? "bg-[#EEF4FC] outline outline-1 outline-[#C7D8F0]" : "bg-[#F6F8FB]"} ${posts.length ? "" : "hidden sm:block"}`}>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">{i === 0 ? "Today" : fmtLocal(`${d}T06:00:00Z`, tz, { hour: undefined, minute: undefined, month: undefined })}</div>
                <div className="space-y-1.5">
                  {posts.map((p) => (
                    <button key={p.post_id} type="button" onClick={() => onOpenPost(p)} className="block w-full rounded-md border-l-[3px] bg-white px-1.5 py-1 text-left hover:shadow-sm" style={{ borderLeftColor: (CHANNELS[p.channel] || {}).color }}>
                      <div className="flex items-center justify-between gap-1 text-[10.5px] text-[#6B7280]">
                        <span className="tabular-nums">{localDateTime(p.slot_at, tz).time}</span>
                      </div>
                      <div className="line-clamp-2 text-[11.5px] leading-snug text-[#0F1B2D]">{p.topic}</div>
                      <div className="mt-1">
                        <StatusPill status={p.status} slotAt={p.slot_at} post={p} short />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {!days.some((x) => x.posts.length) ? <p className="text-sm text-[#6B7280]">Nothing planned in the next 7 days.</p> : null}
        </section>

        <section className="rounded-xl border border-[#E6EBF2] bg-white p-5">
          <div className="mb-2 flex items-center">
            <h3 className="text-[15px] font-semibold text-[#012D76]">What happened</h3>
            <button type="button" onClick={() => onPage("activity")} className="ml-auto text-xs font-medium text-[#0A7FB8] hover:underline">
              All activity
            </button>
          </div>
          {feed === null ? (
            <p className="text-sm text-[#6B7280]">Loading…</p>
          ) : feed.length ? (
            <ul>
              {feed
                .filter((r) => !String(r.action).startsWith("email.") && !["post.scheduled_dry_run", "post.fact_checked"].includes(r.action))
                .slice(0, 7)
                .map((r) => {
                  const x = describe(r, { postTopic: (id) => topics[id] });
                  return (
                    <li key={r.id || `${r.at}-${r.action}`} className="grid grid-cols-[28px_1fr_auto] gap-2.5 border-t border-[#EEF2F7] py-2.5 text-[13.5px] leading-snug first:border-t-0">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${x.who === "Writer" ? "bg-[#F6EFDC] text-[#8A6A16]" : x.who === "Studio" ? "bg-slate-100 text-slate-600" : "bg-[#E7EDF8] text-[#012D76]"}`}>{x.who.slice(0, 1)}</span>
                      <span className="min-w-0">
                        <b className="font-semibold">{x.who}</b> {x.text}
                        {x.detail ? <span className="mt-0.5 line-clamp-2 block text-[12.5px] text-[#6B7280]">{x.detail}</span> : null}
                      </span>
                      <time className="whitespace-nowrap text-[11.5px] text-[#6B7280]">{fmtLocal(r.at, tz, { day: undefined, month: undefined })}</time>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-sm text-[#6B7280]">Nothing in the last 7 days.</p>
          )}
        </section>
      </div>
    </div>
  );
}
