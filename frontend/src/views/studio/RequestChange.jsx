"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, RotateCcw, X } from "lucide-react";
import { Button, call, fmtLocal } from "./shared";

// "Request a change": the person types what should change in plain words. Only the post(s) named
// wait; everything else posts as normal. The writer makes the change at its next scheduled run.
export function RequestChangeBox({ posts, me, tz, onDone, onCancel, initialNote = "" }) {
  const [note, setNote] = useState(initialNote);
  const [visuals, setVisuals] = useState(false);
  const [busy, setBusy] = useState(false);
  const readyBy = me.change_ready_by;
  const lateHours = me.late_window_hours || 6;
  const hasSlides = posts.some((p) => (p.slides || []).length);
  const early = posts.filter((p) => readyBy && Date.parse(p.slot_at) < Date.parse(readyBy));
  const id = `change-${posts.map((p) => p.post_id).join("-")}`;

  const submit = async () => {
    setBusy(true);
    try {
      const r = await call("post", `/studio/posts/${posts[0].post_id}/request-change`, { note, visuals, post_ids: posts.map((p) => p.post_id) });
      toast.success(`Change requested. Ready by about ${fmtLocal(r.ready_by, tz)} IST.`);
      onDone && onDone(r);
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm">
      <label htmlFor={id} className="block font-semibold text-[#7C2D12]">
        What should change?
      </label>
      <textarea
        id={id}
        className="w-full rounded border border-orange-200 bg-white p-2 text-sm"
        rows={3}
        placeholder="For example: shorter caption, warmer ending, fewer slides, different example"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {hasSlides ? (
        <label className="flex items-start gap-2 text-[#7C2D12]">
          <input type="checkbox" className="mt-1" checked={visuals} onChange={(e) => setVisuals(e.target.checked)} />
          <span>This changes the slides or images. Every post that shares them that day waits too.</span>
        </label>
      ) : null}
      <p className="text-[#7C2D12]">
        {posts.length > 1 ? `These ${posts.length} posts wait` : "Only this post waits"}; everything else posts as normal. It is pulled from Buffer until the change is approved. The writer makes the change at its next run:{" "}
        <b>ready by about {readyBy ? fmtLocal(readyBy, tz) : "the next run"} IST</b>.
      </p>
      {early.length ? (
        <p className="flex gap-1.5 rounded border border-red-200 bg-red-50 p-2 font-medium text-red-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {early.length === posts.length && posts.length === 1 ? "This post goes out" : `${early.length} of these go out`} at {fmtLocal(early[0].slot_at, tz)} IST, before the change can be ready. It will be posted late once you approve it, and if it is not
            approved within {lateHours} hours of its time it is skipped (marked missed, not posted).
          </span>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || note.trim().length < 3} onClick={submit}>
          Request the change
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
}

// The state of a change request on a post, with what the person can do next.
export function ChangeStatus({ post, me, tz, onChanged, onApprove, busy }) {
  const [again, setAgain] = useState(false);
  const cr = post.change_request;
  if (!cr) return null;
  const isApprover = me.member.role === "approver";
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const act = async (fn) => {
    try {
      await fn();
      onChanged && onChanged();
    } catch {
      /* toast shown */
    }
  };

  if (post.status === "pending" && cr.state === "done") {
    return (
      <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <div className="font-semibold">Changed on your request. Check it, then approve it.</div>
        <div>
          Request from {cr.by_name || cr.by}: “{cr.note}”
          {cr.writer_note ? <div className="text-xs text-emerald-800">What changed: {cr.writer_note}</div> : null}
        </div>
        {isApprover ? (
          <Button disabled={busy} onClick={onApprove}>
            <Check size={15} /> Approve this post
          </Button>
        ) : (
          <div className="text-xs">Waiting for the approver.</div>
        )}
      </div>
    );
  }

  if (post.status !== "changes_requested") return null;

  if (cr.state === "failed") {
    return (
      <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
        <div className="font-semibold">The change could not be made.</div>
        <div>{cr.error}</div>
        <div className="text-xs">Request: “{cr.note}”</div>
        {again ? (
          <RequestAgain post={post} tz={tz} onDone={() => act(async () => setAgain(false))} onCancel={() => setAgain(false)} initialNote={cr.note} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button variant="outline" disabled={busy} onClick={() => setAgain(true)}>
                <RotateCcw size={14} /> Request again
              </Button>
            ) : null}
            {isApprover ? (
              <Button disabled={busy} onClick={() => onApprove({ keep_original: true })}>
                Post it as it was
              </Button>
            ) : null}
            {canEdit ? (
              <Button variant="ghost" disabled={busy} onClick={() => act(() => call("post", `/studio/posts/${post.post_id}/cancel-change`, {}, { success: "Request cancelled" }))}>
                <X size={14} /> Cancel request
              </Button>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-[#7C2D12]">
      <div>
        <span className="font-semibold">Change requested</span> by {cr.by_name || cr.by} · {fmtLocal(cr.at, tz)}
      </div>
      <div>“{cr.note}”</div>
      <div>
        The writer is making it. Ready by about <b>{fmtLocal(cr.ready_by, tz)} IST</b>
        {(cr.posts || []).length > 1 ? `; ${cr.posts.length} posts that share these slides wait together` : ""}.
      </div>
      {Date.parse(post.slot_at) < Date.parse(cr.ready_by) ? (
        <div className="font-medium text-red-800">
          This post was due at {fmtLocal(post.slot_at, tz)} IST. If it is not approved within {me.late_window_hours || 6} hours of that time, it is marked missed and not posted.
        </div>
      ) : null}
      {canEdit ? (
        <Button variant="outline" disabled={busy} onClick={() => act(() => call("post", `/studio/posts/${post.post_id}/cancel-change`, {}, { success: "Request cancelled. The post waits for approval as it was." }))}>
          <X size={14} /> Cancel request
        </Button>
      ) : null}
    </div>
  );
}

function RequestAgain({ post, tz, onDone, onCancel, initialNote }) {
  const [note, setNote] = useState(initialNote || "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <label htmlFor={`again-${post.post_id}`} className="block font-semibold">
        What should change?
      </label>
      <textarea id={`again-${post.post_id}`} className="w-full rounded border border-red-200 bg-white p-2 text-sm" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <Button
          disabled={busy || note.trim().length < 3}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await call("post", `/studio/posts/${post.post_id}/retry-change`, { note });
              toast.success(`Requested again. Ready by about ${fmtLocal(r.ready_by, tz)} IST.`);
              onDone();
            } catch {
              /* toast shown */
            } finally {
              setBusy(false);
            }
          }}
        >
          Request again
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
}
