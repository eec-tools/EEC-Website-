"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, call } from "./shared";

const TYPE_TONE = {
  buyer: "bg-emerald-50 text-emerald-800",
  supplier: "bg-amber-50 text-amber-800",
  other: "bg-slate-100 text-slate-700",
};

// Who engaged with a posted post. LinkedIn does not give us names, job titles or companies, so the
// team pastes them from the post's notifications; the scheduled task sorts them at its next run.
export default function EngagerLog({ post, me }) {
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const [rows, setRows] = useState(null);
  const [text, setText] = useState("");
  const [action, setAction] = useState("reaction");
  const [busy, setBusy] = useState(false);
  const load = () => call("get", `/studio/posts/${post.post_id}/engagers`).then(setRows).catch(() => setRows([]));

  const add = async () => {
    setBusy(true);
    try {
      await call("post", "/studio/engagers", { post_id: post.post_id, text, action }, { success: "Added. They are sorted at the next run." });
      setText("");
      await load();
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  };
  const update = async (r, patch) => {
    await call("patch", `/studio/engagers/${r.id}`, patch).catch(() => null);
    load();
  };
  const remove = async (r) => {
    await call("delete", `/studio/engagers/${r.id}`).catch(() => null);
    load();
  };

  const counts = (rows || []).reduce((o, r) => ({ ...o, [r.type || "unsorted"]: (o[r.type || "unsorted"] || 0) + 1 }), {});

  return (
    <details onToggle={(e) => e.currentTarget.open && rows === null && load()}>
      <summary className="cursor-pointer font-semibold text-[#012D76]">
        Who engaged
        {rows && rows.length ? ` (${rows.length}: ${["buyer", "supplier", "other", "unsorted"].filter((k) => counts[k]).map((k) => `${counts[k]} ${k}`).join(", ")})` : ""}
      </summary>
      <div className="mt-2 space-y-2">
        {rows && rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[#6B7280]">
                  {["Name", "Type", "Role and company", "Follow up", ""].map((h) => (
                    <th key={h} className="px-1.5 py-1 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[#EFF4F9] align-top">
                    <td className="px-1.5 py-1.5">
                      <div className="font-medium text-[#111827]">{r.name}</div>
                      {r.headline ? <div className="text-[#6B7280]">{r.headline}</div> : null}
                    </td>
                    <td className="px-1.5 py-1.5">
                      {canEdit ? (
                        <select aria-label={`Type for ${r.name}`} className={`rounded px-1 py-0.5 ${TYPE_TONE[r.type] || ""}`} value={r.type || ""} onChange={(e) => update(r, { type: e.target.value || null })}>
                          <option value="">not sorted</option>
                          <option value="buyer">buyer</option>
                          <option value="supplier">supplier</option>
                          <option value="other">other</option>
                        </select>
                      ) : (
                        <span className={`rounded px-1.5 py-0.5 ${TYPE_TONE[r.type] || ""}`}>{r.type || "not sorted"}</span>
                      )}
                    </td>
                    <td className="px-1.5 py-1.5 text-[#3A4759]">{[r.role, r.seniority, r.company].filter(Boolean).join(" · ")}</td>
                    <td className="px-1.5 py-1.5">{r.follow_up ? <span className="font-semibold text-emerald-800">Yes{r.note ? `: ${r.note}` : ""}</span> : r.note || ""}</td>
                    <td className="px-1.5 py-1.5">
                      {canEdit ? (
                        <button type="button" aria-label={`Remove ${r.name}`} className="text-[#6B7280] hover:text-red-700" onClick={() => remove(r)}>
                          <Trash2 size={13} />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : rows ? (
          <p className="text-xs text-[#6B7280]">Nobody added yet.</p>
        ) : null}
        {canEdit ? (
          <div className="space-y-1.5">
            <textarea
              aria-label="People who engaged"
              className="w-full rounded border border-[#E5EBF2] p-2 text-xs"
              rows={3}
              placeholder={"Paste from the post's notifications, one person per line:\nAsha Rao - Procurement Manager at Example Foods"}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="What they did" className="rounded border border-[#E5EBF2] px-2 py-1 text-xs" value={action} onChange={(e) => setAction(e.target.value)}>
                <option value="reaction">reacted</option>
                <option value="comment">commented</option>
                <option value="share">shared</option>
                <option value="message">sent a message</option>
              </select>
              <Button variant="outline" disabled={busy || !text.trim()} onClick={add}>
                Add people
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
