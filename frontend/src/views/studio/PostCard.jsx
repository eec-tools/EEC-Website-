"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, MessageSquare, Pencil, Send, Trash2, Undo2, Zap, ChevronDown, ChevronUp, History } from "lucide-react";
import { Button, Card, ChannelBadge, StatusPill, Preview, ExtLink, call, fmtLocal, localDateTime } from "./shared";

const SLIDE_TYPES = ["cover", "point", "list", "stat", "cta"];

// Says what really happened to the post, so a dry run is never reported as sent.
function resultMessage(p, verb) {
  if (!p) return verb;
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
  return (
    <div className="space-y-3">
      {slides.map((s, i) => (
        <div key={i} className="rounded-md border border-[#E5EBF2] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#3A4759]">
            Slide {i + 1}
            <select className="rounded border border-[#E5EBF2] px-1 py-0.5 text-xs" value={s.type} onChange={(e) => set(i, { type: e.target.value })}>
              {SLIDE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          {s.type === "cover" ? <input className="mb-2 w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="Small label above the title" value={s.kicker || ""} onChange={(e) => set(i, { kicker: e.target.value })} /> : null}
          {s.type === "stat" ? (
            <div className="mb-2 grid grid-cols-3 gap-2">
              <input className="rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="Value" value={s.value || ""} onChange={(e) => set(i, { value: e.target.value })} />
              <input className="col-span-2 rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="Label" value={s.label || ""} onChange={(e) => set(i, { label: e.target.value })} />
              <input className="col-span-3 rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="Source" value={s.source || ""} onChange={(e) => set(i, { source: e.target.value })} />
            </div>
          ) : (
            <input className="mb-2 w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm font-semibold" placeholder="Title" value={s.title || ""} onChange={(e) => set(i, { title: e.target.value })} />
          )}
          {s.type === "list" ? (
            <textarea className="w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm" rows={4} placeholder="One item per line (max 5)" value={(s.items || []).join("\n")} onChange={(e) => set(i, { items: e.target.value.split("\n").slice(0, 5) })} />
          ) : s.type !== "stat" ? (
            <textarea className="w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm" rows={2} placeholder="Body" value={s.body || ""} onChange={(e) => set(i, { body: e.target.value })} />
          ) : null}
          {s.type === "cta" ? <input className="mt-2 w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="Button text" value={s.cta || ""} onChange={(e) => set(i, { cta: e.target.value })} /> : null}
        </div>
      ))}
    </div>
  );
}

export default function PostCard({ post, me, tz, comments = [], onChanged, compact = false }) {
  const role = me.member.role;
  const isApprover = role === "approver";
  const canEdit = role === "approver" || role === "editor";
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [showDetail, setShowDetail] = useState(!compact);
  const [comment, setComment] = useState("");
  const [sendBack, setSendBack] = useState("");
  const [showSendBack, setShowSendBack] = useState(false);
  const [versions, setVersions] = useState(null);
  const [metrics, setMetrics] = useState({});

  const errors = (post.lint || []).filter((l) => l.level === "error");
  const warnings = (post.lint || []).filter((l) => l.level === "warn");
  const waiting = ["pending", "changes_requested"].includes(post.status);
  const live = ["approved", "scheduled"].includes(post.status);
  const editable = ["pending", "changes_requested", "approved", "scheduled", "failed"].includes(post.status);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      onChanged && onChanged();
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  const approve = () =>
    run(async () => {
      let body = {};
      if (errors.length) {
        const reason = window.prompt(`This post breaks a rule:\n\n${errors.map((e) => `• ${e.message}`).join("\n")}\n\nTo approve anyway, give a reason (it is logged):`);
        if (!reason) throw new Error("cancelled");
        body = { override_reason: reason };
      }
      const saved = await call("post", `/studio/posts/${post.post_id}/approve`, body);
      toast.success(resultMessage(saved, "Approved"));
    });

  const startEdit = () => {
    const lt = localDateTime(post.slot_at, tz);
    setDraft({ body: post.body, slides: post.slides || [], alt: post.alt || [], first_comment: post.first_comment || "", date: lt.date, time: lt.time, note: "" });
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

  const loadVersions = async () => setVersions(await call("get", `/studio/posts/${post.post_id}/versions`));

  return (
    <Card className="overflow-hidden" data-testid={`post-${post.post_id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFF4F9] bg-[#F5F9FC] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <ChannelBadge channel={post.channel} />
          <span className="text-sm font-semibold text-[#012D76]">{fmtLocal(post.slot_at, tz)} IST</span>
          <StatusPill status={post.status} slotAt={post.slot_at} />
          {post.version > 1 ? <span className="text-xs text-[#6B7280]">v{post.version}</span> : null}
          {post.buffer_id && post.buffer_id.startsWith("dry-run-") ? <span className="text-xs font-semibold text-amber-700">dry run</span> : null}
        </div>
        <button type="button" className="text-xs text-[#6B7280] hover:text-[#012D76]" onClick={() => setShowDetail(!showDetail)}>
          {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[15px] font-semibold text-[#012D76]">{post.topic}</div>
        <div className="mt-0.5 text-xs text-[#6B7280]">
          {[post.pillar, post.series, post.audience && `for ${post.audience}s`, post.market].filter(Boolean).join(" · ")}
        </div>
      </div>

      {showDetail ? (
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            {editing ? (
              <div className="space-y-3">
                <textarea className="w-full rounded-md border border-[#E5EBF2] p-3 font-mono text-[13px] leading-relaxed" rows={16} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
                <div className="text-right text-xs text-[#6B7280]">{draft.body.length} characters</div>
                {draft.slides.length ? <SlideEditor slides={draft.slides} onChange={(slides) => setDraft({ ...draft, slides })} /> : null}
                {post.channel !== "linkedin_shirali" ? (
                  <input className="w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="First comment (optional)" value={draft.first_comment} onChange={(e) => setDraft({ ...draft, first_comment: e.target.value })} />
                ) : null}
                <div className="flex gap-2">
                  <input type="date" className="rounded border border-[#E5EBF2] px-2 py-1 text-sm" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                  <input type="time" className="rounded border border-[#E5EBF2] px-2 py-1 text-sm" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
                </div>
                <input className="w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="Why you changed it (helps the writer learn)" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
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
                {live ? <p className="text-xs text-amber-700">Saving pulls this post back from the queue; it needs approving again.</p> : null}
              </div>
            ) : (
              <Preview post={post} />
            )}
          </div>

          <div className="space-y-3 text-sm">
            {errors.length ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
                <div className="mb-1 flex items-center gap-1.5 font-semibold">
                  <AlertTriangle size={15} /> Breaks a rule
                </div>
                <ul className="list-disc space-y-0.5 pl-5">{errors.map((e, k) => <li key={k}>{e.message}</li>)}</ul>
              </div>
            ) : null}
            {warnings.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <ul className="list-disc space-y-0.5 pl-5">{warnings.map((e, k) => <li key={k}>{e.message}</li>)}</ul>
              </div>
            ) : null}
            {post.error ? <div className="rounded-md border border-[#E5EBF2] bg-[#F5F9FC] p-3 text-[#3A4759]">{post.error}</div> : null}
            {post.verify_flags && post.verify_flags !== "None" ? (
              <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sky-900">
                <span className="font-semibold">Check before approving: </span>
                {post.verify_flags}
              </div>
            ) : null}
            {post.external_url ? <ExtLink href={post.external_url}>Open the live post</ExtLink> : null}

            {(post.claims || []).some((c) => c.verdict) ? (
              <details open={(post.claims || []).some((c) => c.verdict && c.verdict !== "confirmed")}>
                <summary className="cursor-pointer font-semibold text-[#012D76]">
                  Facts checked ({post.claims.filter((c) => c.verdict === "confirmed").length} of {post.claims.length} confirmed
                  {post.claims[0] && post.claims[0].checked_at ? `, ${fmtLocal(post.claims[0].checked_at, tz)}` : ""})
                </summary>
                <ul className="mt-1 space-y-1">
                  {post.claims.map((c, k) => (
                    <li key={k} className="text-[#3A4759]">
                      <span
                        className={`mr-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          c.verdict === "confirmed" ? "bg-emerald-50 text-emerald-800" : c.verdict === "corrected" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {c.verdict === "confirmed" ? "Confirmed" : c.verdict === "corrected" ? "Changed" : c.verdict ? "Not verified" : "Not checked"}
                      </span>
                      {c.text}
                      {c.note ? <div className="text-xs text-[#6B7280]">{c.note}</div> : null}
                      {c.source ? (
                        <a href={c.source} target="_blank" rel="noreferrer" className="text-xs text-[#0096D6] hover:underline">
                          {" "}
                          Source{c.date ? ` (${c.date})` : ""}
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {(post.sources || []).length ? (
              <details>
                <summary className="cursor-pointer font-semibold text-[#012D76]">Sources ({post.sources.length})</summary>
                <ul className="mt-1 space-y-1">
                  {post.sources.map((s, k) => (
                    <li key={k} className="text-[#3A4759]">
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-[#0096D6] hover:underline">
                        {s.title}
                      </a>
                      {s.date ? ` · ${s.date}` : ""}
                      {s.claim ? <div className="text-xs text-[#6B7280]">{s.claim}</div> : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {post.scores && Object.keys(post.scores).length ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(post.scores).map(([k, v]) => (
                  <span key={k} className="rounded bg-[#F5F9FC] px-2 py-0.5 text-xs text-[#3A4759]">
                    {k} <b>{v}</b>
                  </span>
                ))}
              </div>
            ) : null}
            {post.tests ? <div className="text-xs text-[#6B7280]">Tests: {post.tests}</div> : null}

            {post.status === "posted" && canEdit ? (
              <details>
                <summary className="cursor-pointer font-semibold text-[#012D76]">Enter results</summary>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["impressions", "reactions", "comments", "shares", "saves", "clicks", "enquiries"].map((f) => (
                    <label key={f} className="text-xs text-[#6B7280]">
                      {f}
                      <input type="number" min="0" className="mt-0.5 w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm" defaultValue={(post.metrics || {})[f] ?? ""} onChange={(e) => setMetrics({ ...metrics, [f]: e.target.value === "" ? undefined : Number(e.target.value) })} />
                    </label>
                  ))}
                </div>
                <Button className="mt-2" variant="outline" disabled={busy} onClick={() => run(() => call("post", `/studio/posts/${post.post_id}/metrics`, metrics, { success: "Results saved" }))}>
                  Save results
                </Button>
              </details>
            ) : null}

            {comments.length ? (
              <div className="space-y-1.5">
                {comments.map((c) => (
                  <div key={c.comment_id} className={`rounded-md px-3 py-2 ${c.kind === "change_request" ? "bg-orange-50" : "bg-[#F5F9FC]"}`}>
                    <div className="text-xs text-[#6B7280]">
                      {c.author_name || c.author_email} · {fmtLocal(c.created_at, tz)}
                      {c.kind === "change_request" ? (c.resolved ? " · change request (done)" : " · change request") : ""}
                    </div>
                    <div className="whitespace-pre-wrap text-[#111827]">{c.body}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {!editing ? (
              <div className="flex flex-wrap gap-2 border-t border-[#EFF4F9] pt-3">
                {isApprover && waiting ? (
                  <Button disabled={busy} onClick={approve} data-testid="approve">
                    <Check size={15} /> Approve
                  </Button>
                ) : null}
                {canEdit && editable ? (
                  <Button variant="outline" disabled={busy} onClick={startEdit}>
                    <Pencil size={14} /> Edit
                  </Button>
                ) : null}
                {canEdit && editable ? (
                  <Button variant="outline" disabled={busy} onClick={() => setShowSendBack(!showSendBack)}>
                    <Undo2 size={14} /> Send back
                  </Button>
                ) : null}
                {isApprover && live ? (
                  <Button variant="outline" disabled={busy} onClick={() => run(() => call("post", `/studio/posts/${post.post_id}/unapprove`, {}, { success: "Unapproved" }))}>
                    Unapprove
                  </Button>
                ) : null}
                {isApprover && (waiting || post.status === "approved" || post.status === "scheduled") ? (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Publish this post right now instead of at its time?")) run(async () => toast.success(resultMessage(await call("post", `/studio/posts/${post.post_id}/post-now`, {}), "Sent")));
                    }}
                  >
                    <Zap size={14} /> Post now
                  </Button>
                ) : null}
                {isApprover && editable ? (
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() => {
                      const reason = window.prompt("Drop this post? It will not be published. Optional reason:");
                      if (reason !== null) run(() => call("post", `/studio/posts/${post.post_id}/drop`, { reason }, { success: "Dropped" }));
                    }}
                  >
                    <Trash2 size={14} /> Drop
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={loadVersions}>
                  <History size={14} /> History
                </Button>
              </div>
            ) : null}

            {showSendBack ? (
              <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                <textarea className="w-full rounded border border-orange-200 p-2 text-sm" rows={3} placeholder="What should the writer change? It revises the post and sends it back to you." value={sendBack} onChange={(e) => setSendBack(e.target.value)} />
                <Button
                  disabled={busy || sendBack.trim().length < 3}
                  onClick={() =>
                    run(async () => {
                      await call("post", `/studio/posts/${post.post_id}/request-changes`, { note: sendBack }, { success: "Sent back to the writer" });
                      setSendBack("");
                      setShowSendBack(false);
                    })
                  }
                >
                  <Send size={14} /> Send back
                </Button>
              </div>
            ) : null}

            <div className="flex gap-2">
              <input className="flex-1 rounded-md border border-[#E5EBF2] px-3 py-1.5 text-sm" placeholder="Comment for the team" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button
                variant="outline"
                disabled={busy || !comment.trim()}
                onClick={() =>
                  run(async () => {
                    await call("post", "/studio/comments", { post_id: post.post_id, body: comment });
                    setComment("");
                  })
                }
              >
                <MessageSquare size={14} />
              </Button>
            </div>

            {versions ? (
              <div className="space-y-2">
                {versions.map((v) => (
                  <details key={v.id} className="rounded-md border border-[#E5EBF2] p-2">
                    <summary className="cursor-pointer text-xs text-[#3A4759]">
                      v{v.version} · {v.change_kind.replace("_", " ")} by {v.changed_by} · {fmtLocal(v.created_at, tz)}
                      {v.note ? ` · ${v.note}` : ""}
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-[#111827]">{v.body}</pre>
                  </details>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
