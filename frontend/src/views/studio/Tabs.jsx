"use client";

import React, { useEffect, useState } from "react";
import { Pause, Play, RefreshCw, Plus } from "lucide-react";
import { Button, Card, Empty, ChannelBadge, StatusPill, CHANNELS, ACTIVE_CHANNELS, call, fmtLocal, localDateTime, ExtLink } from "./shared";
import { FormatTable, EnquiriesPanel } from "./MoreTabs";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ---------------- Plan: the week at a glance ----------------
export function PlanTab({ data, tz, onOpen }) {
  const byDate = {};
  for (const p of data.posts) {
    if (p.status === "dropped") continue;
    const d = localDateTime(p.slot_at, tz).date;
    (byDate[d] = byDate[d] || []).push(p);
  }
  const dates = [];
  const start = new Date(`${data.from}T00:00:00Z`);
  const end = new Date(`${data.to}T00:00:00Z`);
  for (let t = start; t < end; t = new Date(t.getTime() + 86400000)) dates.push(t.toISOString().slice(0, 10));
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) weeks.push(dates.slice(i, i + 7));
  const batches = Object.fromEntries(data.batches.map((b) => [b.batch_id, b]));

  return (
    <div className="space-y-6">
      {weeks.map((w) => {
        const weekBatches = [...new Set(w.flatMap((d) => (byDate[d] || []).map((p) => p.batch_id)))].map((id) => batches[id]).filter(Boolean);
        return (
          <Card key={w[0]} className="p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold text-[#012D76]">Week of {fmtLocal(`${w[0]}T06:00:00Z`, tz, { hour: undefined, minute: undefined, weekday: undefined })}</div>
              {weekBatches.map((b) =>
                b.plan && (b.plan.theme || b.experiment) ? (
                  <div key={b.batch_id} className="text-xs text-[#3A4759]">
                    {b.plan.theme ? <span className="font-semibold">{b.plan.theme}</span> : null}
                    {b.experiment ? <span> · Testing: {b.experiment}</span> : null}
                  </div>
                ) : null
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
              {w.map((d) => (
                <div key={d} className="min-h-[96px] rounded-lg border border-[#EFF4F9] bg-[#F5F9FC] p-2">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                    {fmtLocal(`${d}T06:00:00Z`, tz, { hour: undefined, minute: undefined, month: undefined })}
                  </div>
                  <div className="space-y-1.5">
                    {(byDate[d] || []).map((p) => (
                      <button key={p.post_id} type="button" onClick={() => onOpen(p)} className="block w-full rounded-md border border-[#E5EBF2] bg-white p-1.5 text-left hover:border-[#012D76]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold" style={{ color: (CHANNELS[p.channel] || {}).color }}>
                            {(CHANNELS[p.channel] || {}).short} {localDateTime(p.slot_at, tz).time}
                          </span>
                          <span className={`h-2 w-2 rounded-full ${p.status === "posted" ? "bg-emerald-500" : p.status === "scheduled" || p.status === "approved" ? "bg-sky-500" : p.status === "pending" || p.status === "changes_requested" ? "bg-amber-400" : "bg-slate-300"}`} />
                        </div>
                        <div className="line-clamp-2 text-[11px] leading-snug text-[#111827]">{p.topic}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------- Insights ----------------
export function InsightsTab({ me, tz }) {
  const [weeks, setWeeks] = useState(8);
  const [data, setData] = useState(null);
  useEffect(() => {
    call("get", `/studio/insights?weeks=${weeks}`).then(setData).catch(() => {});
  }, [weeks]);
  if (!data) return <Empty title="Loading results…" />;
  const table = (title, groups) => (
    <Card className="overflow-x-auto p-4">
      <div className="mb-2 font-semibold text-[#012D76]">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[#6B7280]">
            {["", "posts", "posted", "missed", "failed", "impressions", "reactions", "comments", "shares", "saves", "clicks", "enquiries"].map((h) => (
              <th key={h} className="px-2 py-1 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([k, g]) => (
            <tr key={k} className="border-t border-[#EFF4F9]">
              <td className="px-2 py-1.5 font-medium text-[#012D76]">{(CHANNELS[k] || {}).label || k}</td>
              {["posts", "posted", "missed", "failed", "impressions", "reactions", "comments", "shares", "saves", "clicks", "enquiries"].map((f) => (
                <td key={f} className="px-2 py-1.5 tabular-nums">{g[f] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#3A4759]">
        Last
        <select className="rounded border border-[#E5EBF2] px-2 py-1" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
          {[4, 8, 12, 26, 52].map((w) => (
            <option key={w} value={w}>{w} weeks</option>
          ))}
        </select>
        <span className="text-xs text-[#6B7280]">Numbers come from Buffer daily. Who engaged is added on each post in the Posted tab; LinkedIn does not share names or job titles with apps.</span>
      </div>
      <EnquiriesPanel me={me} tz={tz} postsById={Object.fromEntries((data.posts || []).map((p) => [p.post_id, p]))} />
      <FormatTable data={data} />
      {table("By channel", data.by_channel)}
      {table("By pillar", data.by_pillar)}
      {Object.keys(data.by_series).filter((k) => k !== "other").length ? table("By series", data.by_series) : null}
    </div>
  );
}

// ---------------- Learning ----------------
export function LearningTab({ me, tz }) {
  const [data, setData] = useState(null);
  const [adding, setAdding] = useState({ channel: "all", rule_type: "tone", rule_text: "" });
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const load = () => call("get", "/studio/learning").then(setData).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  if (!data) return <Empty title="Loading…" />;
  const setStatus = async (r, status) => {
    await call("post", `/studio/rules/${r.id}`, { status }, { success: "Rule updated" });
    load();
  };
  const groups = { candidate: "New rules to confirm", active: "Standing rules", retired: "Retired" };
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        {Object.entries(groups).map(([status, title]) => {
          const rows = data.rules.filter((r) => r.status === status);
          if (!rows.length && status === "retired") return null;
          return (
            <Card key={status} className="p-4">
              <div className="mb-2 font-semibold text-[#012D76]">
                {title} <span className="text-sm font-normal text-[#6B7280]">({rows.length})</span>
              </div>
              {status === "candidate" ? <p className="mb-2 text-xs text-[#6B7280]">The writer noticed these from your edits or results. Confirm the ones you agree with; they then apply to every post.</p> : null}
              <ul className="divide-y divide-[#EFF4F9]">
                {rows.map((r) => (
                  <li key={r.id} className="py-2">
                    <div className="text-sm text-[#111827]">{r.rule_text}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                      <span>{r.rule_type}</span>·<span>{r.channel === "all" ? "all channels" : (CHANNELS[r.channel] || {}).label}</span>·<span>from {r.approver}</span>
                      {r.evidence_count > 1 ? <span>· seen {r.evidence_count}×</span> : null}
                      {canEdit ? (
                        <span className="ml-auto flex gap-1">
                          {status !== "active" ? <Button variant="outline" className="!px-2 !py-0.5 text-xs" onClick={() => setStatus(r, "active")}>Confirm</Button> : null}
                          {status !== "retired" ? <Button variant="ghost" className="!px-2 !py-0.5 text-xs" onClick={() => setStatus(r, "retired")}>Retire</Button> : null}
                        </span>
                      ) : null}
                    </div>
                    {r.example ? <div className="mt-0.5 text-xs italic text-[#6B7280]">{r.example}</div> : null}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
        {canEdit ? (
          <Card className="space-y-2 p-4">
            <div className="font-semibold text-[#012D76]">Add a rule yourself</div>
            <div className="flex gap-2">
              <select className="rounded border border-[#E5EBF2] px-2 py-1 text-sm" value={adding.channel} onChange={(e) => setAdding({ ...adding, channel: e.target.value })}>
                <option value="all">All channels</option>
                {ACTIVE_CHANNELS.map((k) => [k, CHANNELS[k]]).map(([k, c]) => (
                  <option key={k} value={k}>{c.label}</option>
                ))}
              </select>
              <select className="rounded border border-[#E5EBF2] px-2 py-1 text-sm" value={adding.rule_type} onChange={(e) => setAdding({ ...adding, rule_type: e.target.value })}>
                {["tone", "hook", "structure", "length", "cta", "hashtags", "claims", "topic", "brand", "vocabulary", "timing"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <textarea className="w-full rounded border border-[#E5EBF2] p-2 text-sm" rows={2} placeholder="For example: Never open with a question." value={adding.rule_text} onChange={(e) => setAdding({ ...adding, rule_text: e.target.value })} />
            <Button
              disabled={!adding.rule_text.trim()}
              onClick={async () => {
                await call("post", "/studio/rules", adding, { success: "Rule added" });
                setAdding({ ...adding, rule_text: "" });
                load();
              }}
            >
              <Plus size={14} /> Add rule
            </Button>
          </Card>
        ) : null}
      </div>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="mb-2 font-semibold text-[#012D76]">Experiments and results</div>
          {data.learning.length ? (
            <ul className="space-y-2">
              {data.learning.map((l) => (
                <li key={l.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#F5F9FC] px-1.5 py-0.5 text-[11px] uppercase text-[#6B7280]">{l.kind}</span>
                    <span className="font-medium text-[#111827]">{l.title}</span>
                  </div>
                  {l.detail ? <div className="text-xs text-[#3A4759]">{l.detail}</div> : null}
                  {l.evidence ? <div className="text-xs text-[#6B7280]">Evidence: {l.evidence}</div> : null}
                  <div className="text-[11px] text-[#6B7280]">{fmtLocal(l.created_at, tz)} · {l.status}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6B7280]">Nothing yet. The weekly plan names one experiment and the learning step records the result.</p>
          )}
        </Card>
        <Card className="p-4">
          <div className="mb-2 font-semibold text-[#012D76]">Latest research</div>
          {data.research.length ? (
            <ul className="space-y-2">
              {data.research.slice(0, 25).map((r) => (
                <li key={r.id} className="text-sm">
                  <div className="text-[#111827]">{r.finding}</div>
                  <div className="text-xs text-[#6B7280]">
                    {[r.category, r.market, r.source_date].filter(Boolean).join(" · ")} {r.source_url ? <ExtLink href={r.source_url}>source</ExtLink> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6B7280]">The daily researcher files findings here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---------------- Health and settings ----------------
function CadenceEditor({ value, onSave, disabled }) {
  const [c, setC] = useState(value);
  useEffect(() => setC(value), [value]);
  return (
    <div className="space-y-2">
      {Object.keys(CHANNELS).filter((k) => !CHANNELS[k].retired || ((c[k] || {}).days || []).length).map((ch) => {
        const row = c[ch] || { days: [], time: "09:30", max_per_week: 0 };
        const set = (patch) => setC({ ...c, [ch]: { ...row, ...patch } });
        return (
          <div key={ch} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="w-44"><ChannelBadge channel={ch} /></span>
            {DAYS.map((d) => (
              <label key={d} className="inline-flex items-center gap-0.5 text-xs uppercase text-[#3A4759]">
                <input type="checkbox" disabled={disabled} checked={row.days.includes(d)} onChange={(e) => set({ days: e.target.checked ? [...row.days, d] : row.days.filter((x) => x !== d) })} />
                {d}
              </label>
            ))}
            <input type="time" disabled={disabled} className="rounded border border-[#E5EBF2] px-1 py-0.5" value={row.time} onChange={(e) => set({ time: e.target.value })} />
            <label className="text-xs text-[#6B7280]">
              max/week
              <input type="number" min="0" max="14" disabled={disabled} className="ml-1 w-14 rounded border border-[#E5EBF2] px-1 py-0.5" value={row.max_per_week ?? 0} onChange={(e) => set({ max_per_week: Number(e.target.value) })} />
            </label>
          </div>
        );
      })}
      {!disabled ? <Button variant="outline" onClick={() => onSave(c)}>Save cadence</Button> : null}
    </div>
  );
}

export function HealthTab({ me, tz, onChanged, onOpen }) {
  const [h, setH] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [mapping, setMapping] = useState({});
  const [member, setMember] = useState({ email: "", name: "", role: "viewer" });
  const role = me.member.role;
  const isApprover = role === "approver";
  const canEdit = isApprover || role === "editor";
  const load = () =>
    call("get", "/studio/health")
      .then((d) => {
        setH(d);
        setMapping(d.settings.buffer_channels || {});
      })
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);
  if (!h) return <Empty title="Loading…" />;
  const s = h.settings;
  const save = async (key, value, msg = "Saved") => {
    await call("post", "/studio/settings", { key, value }, { success: msg });
    load();
    onChanged && onChanged();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3 p-4">
        <div className="font-semibold text-[#012D76]">Publishing</div>
        <div className="flex flex-wrap items-center gap-2">
          {s.publishing_enabled ? (
            <Button
              variant="danger"
              disabled={!canEdit}
              onClick={async () => {
                if (!window.confirm("Pause all publishing? Every queued post is pulled from Buffer until the approver resumes.")) return;
                await call("post", "/studio/publishing", { enabled: false }, { success: "Publishing paused" });
                load();
                onChanged();
              }}
            >
              <Pause size={14} /> Pause everything
            </Button>
          ) : (
            <Button
              disabled={!isApprover}
              onClick={async () => {
                await call("post", "/studio/publishing", { enabled: true }, { success: "Publishing resumed" });
                load();
                onChanged();
              }}
            >
              <Play size={14} /> Resume publishing
            </Button>
          )}
          <span className={`text-sm font-semibold ${s.publishing_enabled ? "text-emerald-700" : "text-red-700"}`}>{s.publishing_enabled ? "Live" : "Paused"}</span>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={!isApprover} checked={Boolean(s.dry_run)} onChange={(e) => save("dry_run", e.target.checked, e.target.checked ? "Dry run on" : "Dry run off: approved posts now go to Buffer")} />
          Dry run (approving does not send anything to Buffer). Turn off at go-live.
        </label>
        <div className="text-xs text-[#6B7280]">
          Clock last ran: {h.last_tick ? fmtLocal(h.last_tick, tz) : "never"} ·{" "}
          {[["Buffer key", h.buffer_key_set], ["Claude connector key", h.agent_key_set], ["Clock secret", h.cron_secret_set]].map(([n, ok]) => (
            <span key={n} className={ok ? "text-emerald-700" : "text-red-700"}>{n} {ok ? "set" : "missing"} · </span>
          ))}
        </div>
        {canEdit ? (
          <Button
            variant="outline"
            onClick={async () => {
              await call("post", "/studio/run-tick", { force: true }, { success: "Clock run finished" });
              load();
              onChanged();
            }}
          >
            <RefreshCw size={14} /> Run the clock now
          </Button>
        ) : null}
        {h.last_tick_summary && (h.last_tick_summary.errors || []).length ? (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-800">{h.last_tick_summary.errors.join(" · ")}</div>
        ) : null}
        {h.last_tick_summary && (h.last_tick_summary.health || []).length ? (
          <ul className="list-disc pl-5 text-xs text-amber-800">{h.last_tick_summary.health.map((x, k) => <li key={k}>{x}</li>)}</ul>
        ) : null}
      </Card>

      <Card className="space-y-3 p-4">
        <div className="font-semibold text-[#012D76]">Buffer channels</div>
        <p className="text-xs text-[#6B7280]">Connect each account in Buffer first, then match it to an EEC channel here.</p>
        {canEdit ? (
          <Button variant="outline" onClick={async () => setBuffer(await call("get", "/studio/buffer/channels"))}>
            Load channels from Buffer
          </Button>
        ) : null}
        {ACTIVE_CHANNELS.map((ch) => (
          <div key={ch} className="flex items-center gap-2 text-sm">
            <span className="w-44"><ChannelBadge channel={ch} /></span>
            {buffer ? (
              <select className="flex-1 rounded border border-[#E5EBF2] px-2 py-1" value={mapping[ch] || ""} onChange={(e) => setMapping({ ...mapping, [ch]: e.target.value })}>
                <option value="">Not connected</option>
                {buffer.channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.service} · {c.displayName || c.name}
                    {c.isDisconnected ? " (disconnected)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className={mapping[ch] ? "text-emerald-700" : "text-[#6B7280]"}>{mapping[ch] ? `Connected (${mapping[ch]})` : "Not connected"}</span>
            )}
          </div>
        ))}
        {buffer ? <Button onClick={() => save("buffer_channels", mapping, "Channels saved")}>Save channel mapping</Button> : null}
      </Card>

      <Card className="space-y-3 p-4 lg:col-span-2">
        <div className="font-semibold text-[#012D76]">When we post (IST)</div>
        <CadenceEditor value={s.cadence} disabled={!canEdit} onSave={(v) => save("cadence", v, "Cadence saved")} />
      </Card>

      <Card className="space-y-2 p-4">
        <div className="font-semibold text-[#012D76]">Reminders and alerts</div>
        <div className="text-sm text-[#3A4759]">
          The approver is reminded every {s.reminders.interval_hours} hours while posts are waiting (from {s.reminders.start_hours_before} hours before the first one), never between {s.reminders.quiet_hours} IST. Posts not approved within {s.late_window_hours} hours of their time are skipped.
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={!canEdit} checked={Boolean(s.reminders.enabled)} onChange={(e) => save("reminders", { ...s.reminders, enabled: e.target.checked })} /> Reminders on
        </label>
        <div className="text-sm text-[#3A4759]">Alerts go to {s.notify_email}. Weekly report to {(s.report_recipients || []).join(", ")}.</div>
      </Card>

      <Card className="space-y-2 p-4">
        <div className="font-semibold text-[#012D76]">Team</div>
        <ul className="space-y-1 text-sm">
          {h.members.map((m) => (
            <li key={m.email} className="flex items-center justify-between gap-2">
              <span>
                {m.name} <span className="text-[#6B7280]">{m.email}</span>
              </span>
              <span className={`text-xs font-semibold ${m.role === "approver" ? "text-[#A6831F]" : "text-[#3A4759]"}`}>
                {m.role}
                {m.active ? "" : " (off)"}
              </span>
            </li>
          ))}
        </ul>
        {isApprover ? (
          <div className="flex flex-wrap gap-2 border-t border-[#EFF4F9] pt-2">
            <input className="flex-1 rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="email" value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} />
            <input className="w-28 rounded border border-[#E5EBF2] px-2 py-1 text-sm" placeholder="name" value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} />
            <select className="rounded border border-[#E5EBF2] px-2 py-1 text-sm" value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })}>
              {["viewer", "editor", "approver"].map((r) => <option key={r}>{r}</option>)}
            </select>
            <Button
              variant="outline"
              onClick={async () => {
                await call("post", "/studio/members", member, { success: "Team updated" });
                setMember({ email: "", name: "", role: "viewer" });
                load();
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <p className="text-xs text-[#6B7280]">Only the approver can change the team.</p>
        )}
      </Card>

      {h.failed.length ? (
        <Card className="space-y-2 p-4 lg:col-span-2">
          <div className="font-semibold text-red-700">Failed posts</div>
          {h.failed.map((p) => (
            <button key={p.post_id} type="button" onClick={() => onOpen(p)} className="flex w-full items-center gap-3 text-left text-sm hover:underline">
              <ChannelBadge channel={p.channel} /> {fmtLocal(p.slot_at, tz)} · {p.topic}
            </button>
          ))}
        </Card>
      ) : null}

      <Card className="p-4 lg:col-span-2">
        <div className="mb-2 font-semibold text-[#012D76]">Activity log</div>
        <ul className="max-h-80 space-y-1 overflow-y-auto text-xs text-[#3A4759]">
          {h.audit.map((a) => (
            <li key={a.id}>
              <span className="text-[#6B7280]">{fmtLocal(a.at, tz)}</span> · <b>{a.actor}</b> · {a.action} {a.target || ""}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export { StatusPill };
