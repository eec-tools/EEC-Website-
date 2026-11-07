"use client";

import React, { useEffect, useState } from "react";
import { Copy, ExternalLink, Plus, RotateCcw, Undo2 } from "lucide-react";
import { Button, Card, Empty, call, fmtLocal } from "./shared";

// Outreach: the writer drafts LinkedIn comments on buyers' recent posts (Mon, Wed, Fri); the team posts
// them from the EEC page by hand and marks what happened. Nothing is posted automatically.

const input = "w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm";
const ANGLE = { tip: "Tip", question: "Question", fact: "Fact", experience: "Experience", congrats: "Congratulations" };
const OUTCOME = {
  none: { label: "No reply", tone: "bg-slate-100 text-slate-600" },
  reply: { label: "They replied", tone: "bg-sky-50 text-sky-800" },
  conversation: { label: "Conversation", tone: "bg-violet-50 text-violet-800" },
  enquiry: { label: "Enquiry", tone: "bg-emerald-50 text-emerald-800" },
};
const MARKETS = ["UK", "EU", "US", "Canada", "Australia", "South Africa", "Middle East", "Asia-Pacific"];

function ago(iso) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}
const dayName = (date) => (date ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }) : "");

function Chip({ children, tone = "bg-[#F5F9FC] text-[#012D76]" }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{children}</span>;
}

function ReadyCard({ c, tz, canEdit, onDone }) {
  const [text, setText] = useState(c.comment);
  const [mode, setMode] = useState(null); // "rewrite" | "skip"
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setText(c.comment), [c.comment]);
  const changed = text.trim() !== c.comment;
  const send = async (action, body, success) => {
    setBusy(true);
    try {
      await call("post", `/studio/outreach/comments/${c.id}/${action}`, body, { success });
      setMode(null);
      setNote("");
      onDone();
    } catch (e) {
      // toast already shown
    } finally {
      setBusy(false);
    }
  };
  const copyOpen = async () => {
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
    } catch (e) {
      window.prompt("Copy the comment:", text.trim());
    }
    window.open(c.post_url, "_blank", "noopener");
  };
  const rewriting = c.status === "rewrite";
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[#012D76]">{c.target_name}</span>
        <Chip>{ANGLE[c.angle] || c.angle}</Chip>
        {c.post_posted_at ? <span className="text-xs text-[#6B7280]">posted {ago(c.post_posted_at)}</span> : null}
        {c.post_reactions != null ? (
          <span className="text-xs text-[#6B7280]">
            · {c.post_reactions} reactions{c.post_comments != null ? `, ${c.post_comments} comments` : ""}
          </span>
        ) : null}
        <a href={c.post_url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[#0096D6] hover:underline">
          View post <ExternalLink size={12} />
        </a>
      </div>
      {c.post_excerpt ? <p className="mt-1.5 text-sm text-[#4B5563]">{c.post_excerpt}</p> : null}
      {c.why_picked ? <p className="mt-1 text-xs text-[#6B7280]">Why this one: {c.why_picked}</p> : null}

      <div className="mt-3 rounded-lg border border-[#E5EBF2] bg-[#FAFBFD] p-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#A6831F]">Comment as EEC</div>
        {rewriting ? (
          <p className="text-sm text-[#6B7280]">The writer is writing a new version{c.rewrite_request ? ` ("${c.rewrite_request}")` : ""}. It will be here within about an hour.</p>
        ) : canEdit ? (
          <textarea
            className="w-full resize-y rounded border border-transparent bg-transparent p-0 text-[15px] leading-relaxed text-[#111827] focus:border-[#E5EBF2] focus:bg-white focus:p-1.5 focus:outline-none"
            rows={Math.max(3, Math.ceil(text.length / 90))}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#111827]">{c.comment}</p>
        )}
        {(c.sources || []).length ? (
          <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-[#6B7280]">
            Source:
            {c.sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="text-[#0096D6] hover:underline">
                {s.title || "link"}
                {s.date ? ` (${s.date})` : ""}
              </a>
            ))}
          </div>
        ) : null}
        {(c.previous || []).length ? <div className="mt-1 text-[11px] text-[#6B7280]">Version {(c.previous || []).length + 1}</div> : null}
      </div>

      {canEdit && !rewriting ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="gold" onClick={copyOpen} disabled={busy}>
              <Copy size={14} /> {copied ? "Copied: paste it on LinkedIn" : "Copy and open post"}
            </Button>
            <Button onClick={() => send("posted", changed ? { comment: text.trim() } : {}, "Marked as posted")} disabled={busy}>
              Mark posted
            </Button>
            {changed ? (
              <Button variant="outline" onClick={() => send("edit", { comment: text.trim() }, "Saved")} disabled={busy}>
                Save edit
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setMode(mode === "rewrite" ? null : "rewrite")} disabled={busy}>
              <RotateCcw size={14} /> Write another version
            </Button>
            <Button variant="ghost" onClick={() => setMode(mode === "skip" ? null : "skip")} disabled={busy}>
              Skip
            </Button>
          </div>
          {mode ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className={`${input} max-w-md flex-1`}

                placeholder={mode === "rewrite" ? "Optional: what to change (e.g. shorter, ask a question)" : "Optional: why skip (helps the writer pick better posts)"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => (mode === "rewrite" ? send("rewrite", { request: note }, "The writer will send a new version") : send("skip", { reason: note }, "Skipped"))}
              >
                {mode === "rewrite" ? "Ask for a new version" : "Skip this one"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
      <div className="mt-2 text-[11px] text-[#6B7280]">Drafted {fmtLocal(c.created_at, tz)}</div>
    </Card>
  );
}

function DoneRow({ c, tz, canEdit, onDone }) {
  const [note, setNote] = useState(c.outcome_note || "");
  const send = (action, body, success) =>
    call("post", `/studio/outreach/comments/${c.id}/${action}`, body, { success })
      .then(onDone)
      .catch(() => null);
  const label =
    c.status === "posted"
      ? `Posted ${fmtLocal(c.posted_at, tz)}${c.posted_by ? ` by ${c.posted_by.split("@")[0]}` : ""}`
      : c.status === "skipped"
        ? `Skipped${c.skip_reason ? `: ${c.skip_reason}` : ""}`
        : "Set aside: not posted within 4 days";
  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[#012D76]">{c.target_name}</span>
        <Chip>{ANGLE[c.angle] || c.angle}</Chip>
        <span className="text-xs text-[#6B7280]">{label}</span>
        <a href={c.post_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#0096D6] hover:underline">
          post <ExternalLink size={11} />
        </a>
        {canEdit && c.status !== "expired" ? (
          <button type="button" className="ml-auto inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#012D76]" onClick={() => send("undo", {}, "Moved back to Ready")}>
            <Undo2 size={12} /> Undo
          </button>
        ) : null}
        {canEdit && c.status === "expired" ? (
          <button type="button" className="ml-auto text-xs text-[#0096D6] hover:underline" onClick={() => send("posted", {}, "Marked as posted")}>
            I posted it
          </button>
        ) : null}
      </div>
      <p className={`mt-1 text-[#374151] ${c.status === "posted" ? "" : "opacity-70"}`}>{c.comment}</p>
      {c.status === "posted" ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#6B7280]">Result:</span>
          {Object.entries(OUTCOME).map(([k, o]) =>
            canEdit ? (
              <button
                key={k}
                type="button"
                onClick={() => send("outcome", { outcome: k, note }, "Result saved")}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.outcome === k ? `${o.tone} border-transparent` : "border-[#E5EBF2] bg-white text-[#6B7280] hover:text-[#012D76]"}`}
              >
                {o.label}
              </button>
            ) : c.outcome === k ? (
              <Chip key={k} tone={o.tone}>
                {o.label}
              </Chip>
            ) : null,
          )}
          {canEdit && c.outcome && c.outcome !== "none" ? (
            <input
              className={`${input} ml-1 max-w-xs py-0.5 text-xs`}
              placeholder="Note (who replied, what they asked)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (c.outcome_note || "") && send("outcome", { outcome: c.outcome, note }, "Note saved")}
            />
          ) : null}
          {!canEdit && c.outcome_note ? <span className="text-xs text-[#6B7280]">{c.outcome_note}</span> : null}
        </div>
      ) : null}
    </li>
  );
}

function Targets({ rows, tz, canEdit, onDone }) {
  const [adding, setAdding] = useState(false);
  const [v, setV] = useState({ name: "", linkedin_url: "", market: "UK", category: "", reason: "" });
  const [showOff, setShowOff] = useState(false);
  const active = rows.filter((t) => t.active);
  const off = rows.filter((t) => !t.active);
  const add = async () => {
    await call("post", "/studio/outreach/targets", v, { success: "Added" }).catch(() => null);
    setV({ name: "", linkedin_url: "", market: v.market, category: "", reason: "" });
    setAdding(false);
    onDone();
  };
  const toggle = (t) =>
    call("patch", `/studio/outreach/targets/${t.id}`, { active: !t.active }, { success: t.active ? "Removed from outreach" : "Back on the list" })
      .then(onDone)
      .catch(() => null);
  const row = (t) => (
    <tr key={t.id} className="border-t border-[#EFF4F9] align-top">
      <td className="py-2 pr-3">
        <a href={t.linkedin_url} target="_blank" rel="noreferrer" className="font-medium text-[#012D76] hover:underline">
          {t.name}
        </a>
        {t.reason ? <div className="text-xs text-[#6B7280]">{t.reason}</div> : null}
      </td>
      <td className="py-2 pr-3 text-xs">{t.market}</td>
      <td className="py-2 pr-3 text-xs">{t.category}</td>
      <td className="py-2 pr-3 text-xs text-[#6B7280]">{t.added_by === "writer" ? "Writer" : (t.added_by || "").split("@")[0]}</td>
      <td className="py-2 pr-3 text-xs text-[#6B7280]">{t.checked_at ? fmtLocal(t.checked_at, tz, { hour: undefined, minute: undefined }) : "Not yet"}</td>
      <td className="py-2 pr-3 text-xs text-[#6B7280]">{t.last_commented_at ? ago(t.last_commented_at) : ""}</td>
      <td className="py-2 text-right">
        {canEdit ? (
          <button type="button" className="text-xs text-[#6B7280] hover:text-red-700" onClick={() => toggle(t)}>
            {t.active ? "Remove" : "Restore"}
          </button>
        ) : null}
      </td>
    </tr>
  );
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center gap-2">
        <div className="font-semibold text-[#012D76]">
          Buyers we follow <span className="text-sm font-normal text-[#6B7280]">({active.length})</span>
        </div>
        {canEdit ? (
          <Button variant="outline" className="ml-auto" onClick={() => setAdding(!adding)}>
            <Plus size={14} /> Add a buyer
          </Button>
        ) : null}
      </div>
      <p className="mb-3 text-xs text-[#6B7280]">
        Importers, retailers, brands and procurement teams in EEC&apos;s markets. The writer adds new ones it finds (up to 10 a run) and reads each page at most every two days; each buyer gets at most
        one comment a week. Remove anyone you do not want comments on. Competitors are never included.
      </p>
      {adding ? (
        <div className="mb-3 grid gap-2 rounded-lg bg-[#F5F9FC] p-3 sm:grid-cols-2">
          <input className={input} placeholder="Company or person" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          <input className={input} placeholder="LinkedIn page link (linkedin.com/company/...)" value={v.linkedin_url} onChange={(e) => setV({ ...v, linkedin_url: e.target.value })} />
          <select className={input} value={v.market} onChange={(e) => setV({ ...v, market: e.target.value })}>
            {MARKETS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input className={input} placeholder="What they buy (e.g. basmati rice, towels)" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} />
          <input className={`${input} sm:col-span-2`} placeholder="Why they matter (optional)" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} />
          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={add} disabled={!v.name || !v.linkedin_url}>
              Add
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {active.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#6B7280]">
                <th className="pb-1 pr-3 font-semibold">Buyer</th>
                <th className="pb-1 pr-3 font-semibold">Market</th>
                <th className="pb-1 pr-3 font-semibold">Buys</th>
                <th className="pb-1 pr-3 font-semibold">Added by</th>
                <th className="pb-1 pr-3 font-semibold">Last read</th>
                <th className="pb-1 pr-3 font-semibold">Last comment</th>
                <th />
              </tr>
            </thead>
            <tbody>{active.map(row)}</tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[#6B7280]">None yet. The writer builds this list at its next outreach run, or add buyers you already know.</p>
      )}
      {off.length ? (
        <button type="button" className="mt-2 text-xs text-[#0096D6] hover:underline" onClick={() => setShowOff(!showOff)}>
          {showOff ? "Hide" : "Show"} {off.length} removed
        </button>
      ) : null}
      {showOff ? (
        <table className="mt-2 w-full text-sm opacity-70">
          <tbody>{off.map(row)}</tbody>
        </table>
      ) : null}
    </Card>
  );
}

export function OutreachTab({ me, tz, onChanged }) {
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const [data, setData] = useState(null);
  const [view, setView] = useState("ready");
  const load = () =>
    call("get", "/studio/outreach")
      .then(setData)
      .catch(() => setData({ comments: [], targets: [], stats: {}, config: {} }));
  const refresh = () => {
    load();
    onChanged && onChanged();
  };
  useEffect(() => {
    load();
    const id = setInterval(load, 120000);
    return () => clearInterval(id);
  }, []);
  if (!data) return <Empty title="Loading…" />;
  const ready = data.comments.filter((c) => c.status === "ready" || c.status === "rewrite");
  const done = data.comments.filter((c) => !["ready", "rewrite"].includes(c.status));
  const st = data.stats || {};
  const cfg = data.config || {};
  const days = (cfg.days || []).map((d) => d[0].toUpperCase() + d.slice(1)).join(", ");
  const views = [
    ["ready", `Ready to post (${ready.length})`],
    ["done", `Done (${done.length})`],
    ["targets", `Buyers (${data.targets.filter((t) => t.active).length})`],
  ];
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
          <div className="min-w-[240px] flex-1">
            <div className="font-semibold text-[#012D76]">LinkedIn comments, from the EEC page</div>
            <p className="mt-0.5 text-sm text-[#4B5563]">
              Every {days || "Mon, Wed, Fri"} the writer reads buyers&apos; LinkedIn pages and drafts {cfg.per_run || 10} short comments on their recent posts. You post each one by hand: about 30
              seconds.
            </p>
            {data.next_run ? <p className="mt-1 text-xs text-[#6B7280]">Next batch: {dayName(data.next_run)}, after 06:00.</p> : null}
          </div>
          <dl className="grid grid-cols-4 gap-4 text-center">
            {[
              ["Drafted", st.drafted],
              ["Posted", st.posted],
              ["Replies", st.replies],
              ["Enquiries", st.enquiries],
            ].map(([k, n]) => (
              <div key={k}>
                <dd className="text-xl font-semibold text-[#012D76]">{n || 0}</dd>
                <dt className="text-[11px] text-[#6B7280]">{k}</dt>
              </div>
            ))}
            <div className="col-span-4 -mt-2 text-[11px] text-[#6B7280]">last 30 days</div>
          </dl>
        </div>
        <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-[#F5F9FC] px-3 py-2 text-xs text-[#374151]">
          {["Copy and open post", "On LinkedIn, set \u201cCommenting as\u201d to the EEC page", "Paste and post", "Mark posted here"].map((step, i) => (
            <li key={step}>
              <b>{i + 1}.</b> {step}
            </li>
          ))}
          <li className="text-[#6B7280]">Later: mark the result (reply, enquiry) so the writer learns what works</li>
        </ol>
      </Card>

      <div className="flex gap-1 border-b border-[#E5EBF2]">
        {views.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setView(k)}
            className={`border-b-2 px-3 py-1.5 text-sm font-semibold ${view === k ? "border-[#A6831F] text-[#012D76]" : "border-transparent text-[#6B7280] hover:text-[#012D76]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "ready" ? (
        ready.length ? (
          <div className="space-y-3">
            {ready.map((c) => (
              <ReadyCard key={c.id} c={c} tz={tz} canEdit={canEdit} onDone={refresh} />
            ))}
          </div>
        ) : (
          <Empty title="No comments waiting">{data.next_run ? `The next ${cfg.per_run || 10} arrive on ${dayName(data.next_run)}.` : "Outreach is switched off in settings."}</Empty>
        )
      ) : null}
      {view === "done" ? (
        done.length ? (
          <Card className="px-4 py-1">
            <ul className="divide-y divide-[#EFF4F9]">
              {done.map((c) => (
                <DoneRow key={c.id} c={c} tz={tz} canEdit={canEdit} onDone={refresh} />
              ))}
            </ul>
          </Card>
        ) : (
          <Empty title="Nothing posted yet" />
        )
      ) : null}
      {view === "targets" ? <Targets rows={data.targets} tz={tz} canEdit={canEdit} onDone={load} /> : null}
    </div>
  );
}
