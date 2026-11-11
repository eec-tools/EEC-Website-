"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, CheckCircle2, Info, MessageSquare, Pencil, Trash2, Undo2, Zap, History, MoreHorizontal, ExternalLink, Wand2, ChevronDown, CircleSlash, XCircle } from "lucide-react";
import { Button, ChannelBadge, StatusPill, Preview, Kbd, call, fmtLocal, localDateTime, FORMATS, SEGMENTS, CHANNELS, useAsk } from "./shared";
import { RequestChangeBox, ChangeStatus } from "./RequestChange";
import EngagerLog from "./EngagerLog";

const SLIDE_TYPES = ["cover", "point", "list", "stat", "cta", "compare", "question"];
// The human layouts (November 2026). Their words can be edited here; the layout itself stays.
const NEW_TYPES = { photo_cover: "Photo cover", statement_cover: "Cover", why: "Why it happens", check: "Check", saver: "Saver", mistake: "Mistake card", ready: "Ready list", update: "Official update", quotes: "Quote comparison", goodbad: "Good against bad" };
const NEW_FIELDS = [
  ["kicker", "Small line above the headline"],
  ["title", "Headline"],
  ["accent", "Second headline line (green)"],
  ["body", "Explanation"],
  ["ask", "Ask for"],
  ["rule", "The rule"],
  ["why", "Why"],
  ["intro", "Line above the list"],
  ["meaning", "What it means for you"],
  ["close", "Closing line"],
  ["offer", "What the keyword gets them"],
  ["keyword", "DM keyword"],
];

function NewSlideFields({ s, i, set, field }) {
  return (
    <div className="space-y-1.5">
      {NEW_FIELDS.filter(([k]) => s[k] !== undefined || ["title"].includes(k)).map(([k, label]) => (
        <label key={k} className="block">
          <span className="text-[11px] text-[#6B768C]">{label}</span>
          {["body", "why", "meaning", "ask", "rule", "close"].includes(k) ? (
            <textarea className={field} rows={2} value={s[k] || ""} onChange={(e) => set(i, { [k]: e.target.value })} />
          ) : (
            <input className={field} value={s[k] || ""} onChange={(e) => set(i, { [k]: k === "keyword" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : e.target.value })} />
          )}
        </label>
      ))}
      {Array.isArray(s.items) ? (
        <label className="block">
          <span className="text-[11px] text-[#6B768C]">List (one per line)</span>
          <textarea className={field} rows={4} value={s.items.join("\n")} onChange={(e) => set(i, { items: e.target.value.split("\n").slice(0, 5) })} />
        </label>
      ) : null}
      {s.photo ? <p className="text-[11px] text-[#6B768C]">Has a photo. To change the picture, use Request a change and say what it should show.</p> : null}
    </div>
  );
}
// The checker's six scores, in plain words, with the minimum each must reach.
const SCORES = [
  ["stop", "Hook", 8],
  ["useful", "Useful", 8],
  ["true", "True", 10],
  ["human", "Human", 8],
  ["ours", "On brand", 9],
  ["clean", "Clean", 10],
];

// Says what really happened to the post, so a dry run is never reported as sent.
export function resultMessage(p, verb) {
  if (!p) return verb;
  if (p.sending) return `${verb}. Sending to Buffer now; this updates in a few seconds.`;
  if (p.buffer_id && p.buffer_id.startsWith("dry-run-")) return `${verb}. Dry run is on, so nothing was sent to Buffer.`;
  if (p.status === "scheduled") return `${verb}. In the Buffer queue.`;
  if (p.status === "approved" && p.error) return `${verb}, but not sent yet: ${p.error}`;
  if (p.status === "approved") return `${verb}. It goes to Buffer when publishing is resumed.`;
  if (p.status === "failed") return `${verb}, but Buffer did not accept it: ${p.error || "see the post"}`;
  if (p.status === "missed") return `Too late to send: ${p.error || "past the late window"}`;
  return verb;
}

function SlideEditor({ slides, onChange }) {
  const set = (i, patch) => onChange(slides.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const field = "w-full rounded border border-[#D5DCE8] px-2 py-1 text-sm";
  return (
    <div className="space-y-3">
      {slides.map((s, i) => (
        <div key={i} className="rounded-md border border-[#E6EBF2] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#44506A]">
            Slide {i + 1}
            {NEW_TYPES[s.type] ? (
              <span className="rounded bg-[#F2F5EA] px-1.5 py-0.5 font-medium text-[#465C1E]">{NEW_TYPES[s.type]}</span>
            ) : (
              <select className="rounded border border-[#D5DCE8] px-1 py-0.5 text-xs" value={s.type} onChange={(e) => set(i, { type: e.target.value })}>
                {SLIDE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
          {NEW_TYPES[s.type] ? <NewSlideFields s={s} i={i} set={set} field={field} /> : <>
          {s.type === "cover" ? <input className={`mb-2 ${field}`} placeholder="Small label above the title" value={s.kicker || ""} onChange={(e) => set(i, { kicker: e.target.value })} /> : null}
          {s.type === "stat" ? (
            <div className="mb-2 grid grid-cols-3 gap-2">
              <input className={field} placeholder="Value" value={s.value || ""} onChange={(e) => set(i, { value: e.target.value })} />
              <input className={`col-span-2 ${field}`} placeholder="Label" value={s.label || ""} onChange={(e) => set(i, { label: e.target.value })} />
              <input className={`col-span-3 ${field}`} placeholder="Source" value={s.source || ""} onChange={(e) => set(i, { source: e.target.value })} />
            </div>
          ) : (
            <input className={`mb-2 font-semibold ${field}`} placeholder="Title" value={s.title || ""} onChange={(e) => set(i, { title: e.target.value })} />
          )}
          {s.type === "list" ? (
            <textarea className={field} rows={4} placeholder="One item per line (max 5)" value={(s.items || []).join("\n")} onChange={(e) => set(i, { items: e.target.value.split("\n").slice(0, 5) })} />
          ) : s.type !== "stat" ? (
            <textarea className={field} rows={2} placeholder="Body" value={s.body || ""} onChange={(e) => set(i, { body: e.target.value })} />
          ) : null}
          {s.type === "cta" ? <input className={`mt-2 ${field}`} placeholder="Button text" value={s.cta || ""} onChange={(e) => set(i, { cta: e.target.value })} /> : null}
          </>}
        </div>
      ))}
    </div>
  );
}

function Box({ title, right, children }) {
  return (
    <section className="rounded-xl border border-[#E6EBF2] bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[14px] font-semibold text-[#012D76]">{title}</h3>
        {right ? <div className="ml-auto">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function CheckRow({ tone, children, action }) {
  const Icon = { ok: CheckCircle2, warn: AlertTriangle, bad: XCircle, info: Info }[tone];
  const color = { ok: "text-emerald-600", warn: "text-amber-600", bad: "text-red-600", info: "text-sky-600" }[tone];
  return (
    <li className="flex gap-2.5 border-t border-[#EEF2F7] py-2 text-[13.5px] leading-snug text-[#0F1B2D] first:border-t-0 first:pt-0">
      <Icon size={16} className={`mt-0.5 flex-none ${color}`} />
      <div className="min-w-0 flex-1">
        {children}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    </li>
  );
}

// Everything checked about the post, in one list: rules, the writer's notes, facts, sources and the test it belongs to.
export function ChecksPanel({ post, tz, canFix, onFix, busy }) {
  const errors = (post.lint || []).filter((l) => l.level === "error");
  const warnings = (post.lint || []).filter((l) => l.level === "warn");
  const claims = (post.claims || []).filter((c) => c.verdict || c.text);
  const notOk = claims.filter((c) => c.verdict && c.verdict !== "confirmed");
  const unchecked = claims.filter((c) => !c.verdict);
  const flags = post.verify_flags && post.verify_flags !== "None" ? post.verify_flags : null;
  const problems = errors.length + warnings.length + notOk.length + (flags ? 1 : 0) + (post.status === "failed" ? 1 : 0);
  const fix = (msg) =>
    canFix ? (
      <button type="button" disabled={busy} onClick={() => onFix(msg)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0A7FB8] hover:underline disabled:opacity-50">
        <Wand2 size={13} /> Fix it for me
      </button>
    ) : null;
  return (
    <Box title="Checks" right={problems ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-semibold text-amber-800">{problems} to look at</span> : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-800">All passed</span>}>
      <ul>
        {!errors.length && !warnings.length ? <CheckRow tone="ok">Passes every writing rule.</CheckRow> : null}
        {post.status === "failed" && post.error ? <CheckRow tone="bad">Buffer did not accept it: {post.error}</CheckRow> : null}
        {errors.map((e, k) => (
          <CheckRow key={`e${k}`} tone="bad" action={fix(e.message)}>
            <b className="font-semibold">Breaks a rule.</b> {e.message}
          </CheckRow>
        ))}
        {warnings.map((e, k) => (
          <CheckRow key={`w${k}`} tone="warn" action={fix(e.message)}>
            {e.message}
          </CheckRow>
        ))}
        {flags ? (
          <CheckRow tone="warn">
            <b className="font-semibold">Check before approving:</b> {flags}
          </CheckRow>
        ) : null}
        {post.status !== "failed" && post.error ? <CheckRow tone="info">{post.error}</CheckRow> : null}
        {claims.length ? (
          <CheckRow tone={notOk.length ? "warn" : unchecked.length ? "info" : "ok"}>
            <details open={notOk.length > 0}>
              <summary className="cursor-pointer list-none">
                {notOk.length
                  ? `Facts: ${notOk.length} of ${claims.length} not confirmed`
                  : unchecked.length
                    ? `Facts: ${claims.length - unchecked.length} of ${claims.length} checked`
                    : `Facts checked: ${claims.length === 1 ? "1 claim" : `${claims.length} claims`}, ${claims.length === 1 ? "confirmed" : "all confirmed"}`}
                {claims[0] && claims[0].checked_at ? <span className="text-[#6B7280]"> · {fmtLocal(claims[0].checked_at, tz)}</span> : null}
                <ChevronDown size={13} className="ml-1 inline text-[#6B7280]" />
              </summary>
              <ul className="mt-1.5 space-y-1.5">
                {claims.map((c, k) => (
                  <li key={k} className="text-[13px] text-[#44506A]">
                    <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${c.verdict === "confirmed" ? "bg-emerald-50 text-emerald-800" : c.verdict === "corrected" ? "bg-amber-50 text-amber-800" : c.verdict ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                      {c.verdict === "confirmed" ? "Confirmed" : c.verdict === "corrected" ? "Changed" : c.verdict ? "Not verified" : "Not checked"}
                    </span>
                    {c.text}
                    {c.note ? <div className="text-xs text-[#6B7280]">{c.note}</div> : null}
                    {c.source ? (
                      <a href={c.source} target="_blank" rel="noreferrer" className="ml-1 text-xs text-[#0A7FB8] hover:underline">
                        Source{c.date ? ` (${c.date})` : ""}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          </CheckRow>
        ) : null}
        {(post.sources || []).length ? (
          <CheckRow tone="ok">
            <details>
              <summary className="cursor-pointer list-none">
                {post.sources.length} source{post.sources.length === 1 ? "" : "s"} cited <ChevronDown size={13} className="ml-0.5 inline text-[#6B7280]" />
              </summary>
              <ul className="mt-1.5 space-y-1">
                {post.sources.map((s, k) => (
                  <li key={k} className="text-[13px] text-[#44506A]">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-[#0A7FB8] hover:underline">
                      {s.title || s.url}
                    </a>
                    {s.date ? ` · ${s.date}` : ""}
                    {s.claim ? <div className="text-xs text-[#6B7280]">{s.claim}</div> : null}
                  </li>
                ))}
              </ul>
            </details>
          </CheckRow>
        ) : null}
        {post.tests ? <CheckRow tone="info">Part of this week&apos;s test: {post.tests}</CheckRow> : null}
      </ul>
    </Box>
  );
}

export function QualityBox({ scores }) {
  const rows = SCORES.filter(([k]) => scores && scores[k] != null);
  if (!rows.length) return null;
  const avg = rows.reduce((n, [k]) => n + Number(scores[k]), 0) / rows.length;
  return (
    <Box title="Quality">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[26px] font-semibold leading-none tabular-nums text-[#012D76]">{avg.toFixed(1)}</span>
        <span className="text-sm text-[#6B7280]">/ 10 · the checker&apos;s score</span>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {rows.map(([k, label, min]) => {
          const v = Number(scores[k]);
          return (
            <div key={k} className="text-center" title={`${label}: ${v} out of 10 (needs ${min})`}>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
                <div className={`h-full rounded-full ${v < min ? "bg-amber-500" : v >= 9 ? "bg-emerald-600" : "bg-emerald-400"}`} style={{ width: `${Math.max(8, v * 10)}%` }} />
              </div>
              <div className="mt-1 text-[10.5px] text-[#6B7280]">{label}</div>
              <div className="text-[11px] font-semibold tabular-nums text-[#0F1B2D]">{v}</div>
            </div>
          );
        })}
      </div>
    </Box>
  );
}

function MoreMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const shown = items.filter(Boolean);
  if (!shown.length) return null;
  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <MoreHorizontal size={16} /> <span className="hidden sm:inline">More</span>
      </Button>
      {open ? (
        <div role="menu" className="absolute bottom-full right-0 z-20 mb-2 w-52 overflow-hidden rounded-lg border border-[#E6EBF2] bg-white py-1 shadow-lg sm:left-0 sm:right-auto">
          {shown.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-[#F5F9FC] disabled:opacity-50 ${it.danger ? "text-red-700" : "text-[#0F1B2D]"}`}
            >
              <it.icon size={15} /> {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// One post in full: preview (or editor), checks, quality, team notes, and the decision bar.
// mode "pane" sits on the right of the Approve list; "drawer" slides over other pages.
export default function PostDetail({ post, me, tz, comments = [], onChanged, shortcuts = false, onClose }) {
  const ask = useAsk();
  const role = me.member.role;
  const isApprover = role === "approver";
  const canEdit = role === "approver" || role === "editor";
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [comment, setComment] = useState("");
  const [showChange, setShowChange] = useState(false);
  const [versions, setVersions] = useState(null);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    setEditing(false);
    setShowChange(false);
    setVersions(null);
    setComment("");
  }, [post.post_id]);

  const errors = (post.lint || []).filter((l) => l.level === "error");
  const waiting = ["pending", "changes_requested"].includes(post.status);
  const live = ["approved", "scheduled"].includes(post.status);
  const editable = ["pending", "changes_requested", "approved", "scheduled", "failed"].includes(post.status);
  const cr = post.change_request;
  const changeOpen = Boolean(cr && post.status === "changes_requested");
  const changeDone = Boolean(cr && cr.state === "done" && post.status === "pending");
  const due = Date.parse(post.slot_at) <= Date.now() && post.status === "scheduled";
  const requestable = ["pending", "approved", "scheduled", "failed"].includes(post.status) && !due && !changeOpen;
  const canApprove = isApprover && waiting && !changeOpen && !changeDone;

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      onChanged && onChanged({ quiet: true });
    } catch {
      /* toast already shown, or cancelled */
    } finally {
      setBusy(false);
    }
  };

  // Approve answers at once; the post goes to Buffer in the background and the page updates itself.
  const approve = (extra = {}) =>
    run(async () => {
      let body = extra && extra.keep_original ? { keep_original: true } : {};
      if (errors.length) {
        const reason = await ask({
          title: "Approve a post that breaks a rule?",
          body: errors.map((e) => `• ${e.message}`).join("\n"),
          input: { placeholder: "Why it is fine to approve anyway (saved in the log)", required: true },
          confirm: "Approve anyway",
        });
        if (!reason) throw new Error("cancelled");
        body = { ...body, override_reason: reason };
      }
      const saved = await call("post", `/studio/posts/${post.post_id}/approve`, body);
      toast.success(resultMessage(saved, extra && extra.keep_original ? "Approved as it was" : "Approved"));
      if (saved && saved.sending && onChanged) [4000, 10000].forEach((ms) => setTimeout(() => onChanged({ quiet: true }), ms));
    });

  const startEdit = () => {
    const lt = localDateTime(post.slot_at, tz);
    setDraft({ body: post.body, slides: post.slides || [], alt: post.alt || [], first_comment: post.first_comment || "", date: lt.date, time: lt.time, note: "" });
    setShowChange(false);
    setEditing(true);
  };

  const saveEdit = (thenApprove) =>
    run(async () => {
      const lt = localDateTime(post.slot_at, tz);
      const payload = { note: draft.note || undefined };
      if (draft.body !== post.body) payload.body = draft.body;
      if (JSON.stringify(draft.slides) !== JSON.stringify(post.slides || [])) payload.slides = draft.slides;
      if (JSON.stringify(draft.alt) !== JSON.stringify(post.alt || [])) payload.alt = draft.alt;
      if ((draft.first_comment || "") !== (post.first_comment || "")) payload.first_comment = draft.first_comment || null;
      if (draft.date !== lt.date) payload.date = draft.date;
      if (draft.time !== lt.time) payload.time = draft.time;
      const saved = await call("patch", `/studio/posts/${post.post_id}`, payload, { success: "Saved" });
      setEditing(false);
      if (thenApprove && isApprover) {
        const errs = (saved.lint || []).filter((l) => l.level === "error");
        if (errs.length) return;
        await call("post", `/studio/posts/${post.post_id}/approve`, {}, { success: "Saved and approved" });
      }
    });

  const fixIt = (message) =>
    run(async () => {
      await call("post", `/studio/posts/${post.post_id}/request-change`, { note: `Fix this, and keep everything else as it is: ${message}` });
      toast.success(`Sent to the writer. The fixed version will be here by about ${fmtLocal(me.change_ready_by, tz, { weekday: undefined, day: undefined, month: undefined })}.`);
    });

  const postNow = () =>
    run(async () => {
      if (!(await ask({ title: "Publish this post now?", body: "It goes out right away instead of at its planned time.", confirm: "Publish now" }))) throw new Error("cancelled");
      toast.success(resultMessage(await call("post", `/studio/posts/${post.post_id}/post-now`, {}), "Sent"));
    });

  const drop = () =>
    run(async () => {
      const reason = await ask({ title: "Drop this post?", body: "It will not be published. You can see it later under Posts, filtered by Dropped.", input: { placeholder: "Reason (optional)" }, confirm: "Drop post", danger: true });
      if (reason === null) throw new Error("cancelled");
      await call("post", `/studio/posts/${post.post_id}/drop`, { reason }, { success: "Dropped" });
    });

  const loadVersions = async () => setVersions(versions ? null : await call("get", `/studio/posts/${post.post_id}/versions`));

  // Shortcuts on the Approve page: A approve, R request a change, E edit.
  useEffect(() => {
    if (!shortcuts) return undefined;
    const onKey = (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey || busy || editing) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const k = e.key.toLowerCase();
      if (k === "a" && canApprove) (e.preventDefault(), approve());
      if (k === "r" && canEdit && requestable) (e.preventDefault(), setShowChange((x) => !x));
      if (k === "e" && canEdit && editable) (e.preventDefault(), startEdit());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const meta = [CHANNELS[post.channel] ? CHANNELS[post.channel].label : post.channel, `${fmtLocal(post.slot_at, tz)} IST`, SEGMENTS[post.segment] ? `For ${SEGMENTS[post.segment].toLowerCase()}` : null, post.pillar, post.market, FORMATS[post.format], post.series].filter(Boolean);
  const field = "w-full rounded border border-[#D5DCE8] px-2 py-1 text-sm";

  return (
    <div className="flex min-h-full flex-col" data-testid={`post-${post.post_id}`}>
      <div className="flex items-start gap-3 border-b border-[#E6EBF2] bg-white px-4 py-4 md:px-6">
        <ChannelBadge channel={post.channel} iconOnly size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold leading-snug text-[#0F1B2D] md:text-[19px]">{post.topic}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            {[...meta, post.version > 1 ? `version ${post.version}` : null].filter(Boolean).join("  ·  ")}
          </p>
        </div>
        <div className="flex flex-none flex-col items-end gap-1.5">
          <StatusPill status={post.status} slotAt={post.slot_at} post={post} />
          {post.buffer_id && post.buffer_id.startsWith("dry-run-") ? <span className="text-[11.5px] font-semibold text-amber-700">dry run</span> : null}
          {onClose ? (
            <button type="button" onClick={onClose} className="mt-1 text-xs text-[#6B7280] hover:text-[#012D76]">
              Close <Kbd>Esc</Kbd>
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid flex-1 gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {editing ? (
            <div className="space-y-3 rounded-xl border border-[#E6EBF2] bg-white p-4">
              <textarea className="w-full rounded-md border border-[#D5DCE8] p-3 font-mono text-[13px] leading-relaxed" rows={16} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
              <div className="text-right text-xs text-[#6B7280]">{draft.body.length} characters</div>
              {draft.slides.length ? <SlideEditor slides={draft.slides} onChange={(slides) => setDraft({ ...draft, slides })} /> : null}
              {post.channel !== "linkedin_shirali" ? <input className={field} placeholder="First comment (optional)" value={draft.first_comment} onChange={(e) => setDraft({ ...draft, first_comment: e.target.value })} /> : null}
              <div className="flex gap-2">
                <input type="date" className="rounded border border-[#D5DCE8] px-2 py-1 text-sm" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                <input type="time" className="rounded border border-[#D5DCE8] px-2 py-1 text-sm" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
              </div>
              <input className={field} placeholder="Why you changed it (helps the writer learn)" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
              <div className="flex flex-wrap gap-2">
                {isApprover ? (
                  <Button disabled={busy} onClick={() => saveEdit(true)}>
                    <Check size={15} /> Save and approve
                  </Button>
                ) : null}
                <Button variant="outline" disabled={busy} onClick={() => saveEdit(false)}>
                  Save
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
              {live ? <p className="text-xs text-amber-700">Saving takes this post out of the queue; it needs approving again.</p> : null}
            </div>
          ) : (
            <div className="max-w-[560px]">
              <Preview post={post} />
            </div>
          )}
          {post.external_url ? (
            <a href={post.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#0A7FB8] hover:underline">
              Open the live post <ExternalLink size={13} />
            </a>
          ) : null}
          {post.status === "posted" ? <EngagerLog post={post} me={me} /> : null}
        </div>

        <div className="min-w-0 space-y-4">
          <ChangeStatus post={post} me={me} tz={tz} busy={busy} onChanged={() => onChanged && onChanged({ quiet: true })} onApprove={approve} />
          {showChange ? <RequestChangeBox posts={[post]} me={me} tz={tz} onCancel={() => setShowChange(false)} onDone={() => run(async () => setShowChange(false))} /> : null}
          <ChecksPanel post={post} tz={tz} canFix={canEdit && requestable && !editing} onFix={fixIt} busy={busy} />
          <QualityBox scores={post.scores} />
          {post.status === "posted" && canEdit ? (
            <Box title="Results">
              <p className="mb-2 text-xs text-[#6B7280]">Buffer fills these in daily. Add what it cannot see, such as enquiries.</p>
              <div className="grid grid-cols-3 gap-2">
                {["impressions", "reactions", "comments", "shares", "saves", "clicks", "enquiries"].map((f) => (
                  <label key={f} className="text-xs capitalize text-[#6B7280]">
                    {f}
                    <input type="number" min="0" className="mt-0.5 w-full rounded border border-[#D5DCE8] px-2 py-1 text-sm tabular-nums" defaultValue={(post.metrics || {})[f] ?? ""} onChange={(e) => setMetrics({ ...metrics, [f]: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </label>
                ))}
              </div>
              <Button className="mt-2" variant="outline" disabled={busy} onClick={() => run(() => call("post", `/studio/posts/${post.post_id}/metrics`, metrics, { success: "Results saved" }))}>
                Save results
              </Button>
            </Box>
          ) : null}
          <Box title="Team notes">
            {comments.length ? (
              <ul className="mb-2 space-y-2.5">
                {comments.map((c) => (
                  <li key={c.comment_id} className={`text-[13.5px] leading-snug ${c.kind === "change_request" ? "rounded-md bg-orange-50 px-2.5 py-2" : ""}`}>
                    <div className="text-xs text-[#6B7280]">
                      {c.author_name || c.author_email} · {fmtLocal(c.created_at, tz)}
                      {c.kind === "change_request" ? (c.resolved ? " · change request, done" : " · change request") : ""}
                    </div>
                    <div className="whitespace-pre-wrap text-[#0F1B2D]">{c.body}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-[13px] text-[#6B7280]">No notes yet.</p>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                run(async () => {
                  await call("post", "/studio/comments", { post_id: post.post_id, body: comment });
                  setComment("");
                });
              }}
            >
              <input className="min-w-0 flex-1 rounded-md border border-[#D5DCE8] px-3 py-1.5 text-sm" placeholder="Add a note for the team" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button type="submit" variant="outline" disabled={busy || !comment.trim()} aria-label="Add note">
                <MessageSquare size={14} />
              </Button>
            </form>
          </Box>
          {versions ? (
            <Box title="History" right={<button type="button" className="text-xs text-[#6B7280] hover:text-[#012D76]" onClick={() => setVersions(null)}>Hide</button>}>
              <div className="space-y-2">
                {versions.map((v) => (
                  <details key={v.id} className="rounded-md border border-[#E6EBF2] p-2">
                    <summary className="cursor-pointer text-xs text-[#44506A]">
                      Version {v.version} · {v.change_kind.replace("_", " ")} by {v.changed_by} · {fmtLocal(v.created_at, tz)}
                      {v.note ? ` · ${v.note}` : ""}
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[#0F1B2D]">{v.body}</pre>
                  </details>
                ))}
              </div>
            </Box>
          ) : null}
        </div>
      </div>

      {!editing ? (
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t border-[#E6EBF2] bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          {canApprove ? (
            <Button disabled={busy} onClick={() => approve()} data-testid="approve" className="flex-1 sm:flex-none">
              <Check size={16} /> Approve{shortcuts ? <Kbd light>A</Kbd> : null}
            </Button>
          ) : null}
          {canEdit && requestable ? (
            <Button variant="outline" disabled={busy} onClick={() => setShowChange(!showChange)} aria-label="Request a change">
              <Undo2 size={15} /> <span className={canApprove ? "hidden sm:inline" : ""}>Request a change</span>
              {shortcuts ? <Kbd>R</Kbd> : null}
            </Button>
          ) : null}
          {canEdit && editable ? (
            <Button variant="outline" disabled={busy} onClick={startEdit} className="hidden sm:inline-flex">
              <Pencil size={14} /> Edit{shortcuts ? <Kbd>E</Kbd> : null}
            </Button>
          ) : null}
          <MoreMenu
            items={[
              canEdit && editable ? { label: "Edit", icon: Pencil, onClick: startEdit, disabled: busy } : null,
              isApprover && !changeOpen && (waiting || post.status === "approved" || post.status === "scheduled") ? { label: "Publish now", icon: Zap, onClick: postNow, disabled: busy } : null,
              isApprover && live ? { label: "Unapprove", icon: CircleSlash, onClick: () => run(() => call("post", `/studio/posts/${post.post_id}/unapprove`, {}, { success: "Unapproved. It waits for approval again." })), disabled: busy } : null,
              { label: versions ? "Hide history" : "History", icon: History, onClick: loadVersions },
              isApprover && editable ? { label: "Drop post", icon: Trash2, onClick: drop, danger: true, disabled: busy } : null,
            ]}
          />
          {shortcuts ? (
            <span className="ml-auto hidden items-center gap-1 text-xs text-[#6B7280] lg:flex">
              <kbd className="rounded border border-b-2 border-[#D5DCE8] bg-white px-1 text-[10.5px]">J</kbd>
              <kbd className="rounded border border-b-2 border-[#D5DCE8] bg-white px-1 text-[10.5px]">K</kbd> next and previous post
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
