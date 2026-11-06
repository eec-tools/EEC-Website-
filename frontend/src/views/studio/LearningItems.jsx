"use client";

import React, { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { Button, call, fmtLocal } from "./shared";

export const DOMAIN = {
  social: { label: "Social", tone: "bg-sky-50 text-sky-800", hint: "How to post: hooks, formats, length, timing. The writer decides these." },
  business: { label: "Business", tone: "bg-amber-50 text-amber-900", hint: "What EEC says and offers: services, claims, tone, audience. The business team decides these." },
};

export function DomainChip({ domain }) {
  const d = DOMAIN[domain] || DOMAIN.business;
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${d.tone}`} title={d.hint}>
      {d.label}
    </span>
  );
}

const isConfirmed = (kind, status) => (kind === "rule" ? status === "active" : status === "approved");

// Confirm / Discard, with an optional note for the writer.
export function DecideButtons({ kind, item, onDone, confirmLabel = "Confirm", discardLabel = "Discard" }) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async (decision) => {
    setBusy(true);
    try {
      await call("post", `/studio/learnings/${kind}/${item.id}/decide`, { decision, note: note.trim() || undefined }, { success: decision === "confirm" ? "Confirmed" : "Discarded" });
      setNote("");
      setOpen(false);
      onDone && onDone();
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button className="!px-2 !py-0.5 text-xs" disabled={busy} onClick={() => go("confirm")}>
          <Check size={13} /> {confirmLabel}
        </Button>
        <Button variant="outline" className="!px-2 !py-0.5 text-xs" disabled={busy} onClick={() => go("discard")}>
          <X size={13} /> {discardLabel}
        </Button>
        {!open ? (
          <button type="button" className="text-xs text-[#0096D6] hover:underline" onClick={() => setOpen(true)}>
            add a note
          </button>
        ) : null}
      </div>
      {open ? (
        <input
          aria-label="Note for the writer"
          className="w-full rounded border border-[#E5EBF2] px-2 py-1 text-xs"
          placeholder="Optional: why (the writer reads this)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      ) : null}
    </div>
  );
}

// Who decided, why, and an Undo that flips the decision.
export function DecidedLine({ kind, item, tz, canEdit, onDone }) {
  const [busy, setBusy] = useState(false);
  if (!item.decided_by) return null;
  const confirmed = isConfirmed(kind, item.status);
  const who = item.decided_by === "writer" ? "the writer" : item.decided_by;
  const undo = async () => {
    setBusy(true);
    try {
      await call("post", `/studio/learnings/${kind}/${item.id}/decide`, { decision: confirmed ? "discard" : "confirm", note: `Undid ${who}'s decision` }, { success: "Decision changed" });
      onDone && onDone();
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`mt-1.5 rounded px-2 py-1 text-xs ${confirmed ? "bg-emerald-50 text-emerald-900" : "bg-[#F5F9FC] text-[#3A4759]"}`}>
      <b>{confirmed ? "Confirmed" : "Discarded"}</b> by {who}
      {item.decided_at ? ` · ${fmtLocal(item.decided_at, tz)}` : ""}
      {item.decision_note ? <span>: {item.decision_note}</span> : null}
      {canEdit ? (
        <button type="button" disabled={busy} onClick={undo} className="ml-2 inline-flex items-center gap-0.5 font-semibold text-[#0096D6] hover:underline">
          <RotateCcw size={11} /> {confirmed ? "Discard instead" : "Confirm instead"}
        </button>
      ) : null}
    </div>
  );
}
