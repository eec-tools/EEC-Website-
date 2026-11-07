"use client";

import React, { useEffect, useState } from "react";
import { Pause, Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button, Card, ChannelBadge, CHANNELS, ACTIVE_CHANNELS, call, fmtLocal, useAsk } from "./shared";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const SECTIONS = [
  ["publishing", "Publishing"],
  ["channels", "Buffer channels"],
  ["schedule", "Schedule"],
  ["outreach", "Outreach"],
  ["reminders", "Reminders"],
  ["team", "Team"],
];

function DayToggles({ days, onChange, disabled }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-[#E6EBF2]" role="group">
      {DAYS.map((d) => {
        const on = days.includes(d);
        return (
          <button
            key={d}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(on ? days.filter((x) => x !== d) : [...days, d])}
            className={`h-8 w-10 border-l border-[#E6EBF2] text-[12px] font-medium capitalize first:border-l-0 disabled:cursor-not-allowed ${on ? "bg-[#012D76] text-white" : "bg-white text-[#44506A] hover:bg-[#F5F9FC]"}`}
          >
            {d.slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}

function CadenceEditor({ value, onSave, disabled }) {
  const [c, setC] = useState(value);
  useEffect(() => setC(value), [value]);
  const changed = JSON.stringify(c) !== JSON.stringify(value);
  return (
    <div className="space-y-3">
      {Object.keys(CHANNELS)
        .filter((k) => !CHANNELS[k].retired || ((c[k] || {}).days || []).length)
        .map((ch) => {
          const row = c[ch] || { days: [], time: "09:30", max_per_week: 0 };
          const set = (patch) => setC({ ...c, [ch]: { ...row, ...patch } });
          return (
            <div key={ch} className="flex flex-wrap items-center gap-3 border-t border-[#EEF2F7] pt-3 first:border-t-0 first:pt-0">
              <span className="w-48">
                <ChannelBadge channel={ch} />
              </span>
              <DayToggles days={row.days} disabled={disabled} onChange={(days) => set({ days })} />
              <label className="flex items-center gap-1.5 text-[13px] text-[#44506A]">
                at
                <input type="time" disabled={disabled} className="h-8 rounded-lg border border-[#E6EBF2] px-2" value={row.time} onChange={(e) => set({ time: e.target.value })} />
                IST
              </label>
              <label className="flex items-center gap-1.5 text-[13px] text-[#44506A]">
                at most
                <input type="number" min="0" max="14" disabled={disabled} className="h-8 w-14 rounded-lg border border-[#E6EBF2] px-2 tabular-nums" value={row.max_per_week ?? 0} onChange={(e) => set({ max_per_week: Number(e.target.value) })} />
                a week
              </label>
            </div>
          );
        })}
      {!disabled ? (
        <div className="flex gap-2 pt-1">
          <Button disabled={!changed} onClick={() => onSave(c)}>
            Save schedule
          </Button>
          {changed ? (
            <Button variant="ghost" onClick={() => setC(value)}>
              Undo changes
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Section({ id, title, intro, children }) {
  return (
    <section id={`set-${id}`} className="scroll-mt-4">
      <Card className="p-5">
        <h2 className="text-[16px] font-semibold text-[#012D76]">{title}</h2>
        {intro ? <p className="mt-0.5 text-[13px] text-[#6B7280]">{intro}</p> : null}
        <div className="mt-4">{children}</div>
      </Card>
    </section>
  );
}

function Check({ ok, warn, children }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  return (
    <li className="flex items-start gap-2 py-1 text-[13.5px]">
      <Icon size={16} className={`mt-0.5 flex-none ${ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-red-600"}`} />
      <span>{children}</span>
    </li>
  );
}

export default function SettingsPage({ me, tz, onChanged, onOpenPost }) {
  const ask = useAsk();
  const [h, setH] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [mapping, setMapping] = useState({});
  const [member, setMember] = useState({ email: "", name: "", role: "viewer" });
  const [reach, setReach] = useState(null);
  const role = me.member.role;
  const isApprover = role === "approver";
  const canEdit = isApprover || role === "editor";
  const load = () =>
    call("get", "/studio/health")
      .then((d) => {
        setH(d);
        setMapping(d.settings.buffer_channels || {});
        setReach(d.settings.outreach || { enabled: true, days: ["mon", "wed", "fri"], per_run: 10 });
      })
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);
  if (!h) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;
  const s = h.settings;
  const save = async (key, value, msg = "Saved") => {
    await call("post", "/studio/settings", { key, value }, { success: msg });
    load();
    onChanged && onChanged({ quiet: true });
  };
  const used = Object.entries(s.cadence || {}).filter(([k, c]) => (c.days || []).length && !(CHANNELS[k] || {}).retired);
  const unmapped = used.filter(([k]) => !mapping[k]);
  const clockOk = h.last_tick && Date.now() - Date.parse(h.last_tick) < 2 * 3600000;

  return (
    <div className="mx-auto flex max-w-[1100px] gap-6 p-4 md:p-6">
      <nav className="sticky top-4 hidden h-fit w-44 flex-none space-y-0.5 lg:block" aria-label="Settings sections">
        {SECTIONS.map(([k, label]) => (
          <a key={k} href={`#set-${k}`} className="block rounded-md px-3 py-1.5 text-[13.5px] text-[#44506A] hover:bg-white hover:text-[#012D76]">
            {label}
          </a>
        ))}
      </nav>
      <div className="min-w-0 flex-1 space-y-4">
        <Section id="publishing" title="Publishing" intro="Whether approved posts go out, and the parts that make that happen.">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${!s.publishing_enabled ? "bg-red-50 text-red-800" : s.dry_run ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              {!s.publishing_enabled ? "Paused" : s.dry_run ? "Dry run: approving sends nothing to Buffer" : "Live: approved posts go to Buffer"}
            </span>
            {s.publishing_enabled ? (
              <Button
                variant="danger"
                disabled={!canEdit}
                onClick={async () => {
                  if (!(await ask({ title: "Pause all publishing?", body: "Every queued post is taken out of Buffer until the approver resumes.", confirm: "Pause everything", danger: true }))) return;
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
          </div>
          <label className="mt-3 flex items-start gap-2 text-[13.5px] text-[#0F1B2D]">
            <input type="checkbox" className="mt-0.5" disabled={!isApprover} checked={Boolean(s.dry_run)} onChange={(e) => save("dry_run", e.target.checked, e.target.checked ? "Dry run on" : "Dry run off: approved posts now go to Buffer")} />
            <span>
              Dry run <span className="text-[#6B7280]">(approving does not send anything to Buffer; turn it off to go live)</span>
            </span>
          </label>
          <div className="mt-4 rounded-lg bg-[#F6F8FB] p-3">
            <div className="mb-1 text-[12px] font-medium uppercase tracking-wide text-[#6B7280]">Set-up check</div>
            <ul>
              <Check ok={h.buffer_key_set}>{h.buffer_key_set ? "Buffer key is set" : "Buffer key is missing: add BUFFER_API_KEY to the backend's settings on Vercel"}</Check>
              <Check ok={!unmapped.length} warn={!h.buffer_key_set}>
                {unmapped.length ? `${unmapped.length} channel${unmapped.length === 1 ? " is" : "s are"} not connected to Buffer (see Buffer channels)` : "Every channel in the schedule is connected to Buffer"}
              </Check>
              <Check ok={h.agent_key_set}>{h.agent_key_set ? "The writer's connector key is set" : "The writer's connector key is missing (SOCIAL_AGENT_KEY)"}</Check>
              <Check ok={h.cron_secret_set}>{h.cron_secret_set ? "The clock's secret is set" : "The clock's secret is missing (CRON_SECRET)"}</Check>
              <Check ok={clockOk}>{h.last_tick ? `The clock last ran ${fmtLocal(h.last_tick, tz)}${clockOk ? "" : ": over 2 hours ago"}` : "The clock has never run"}</Check>
            </ul>
            {h.last_tick_summary && (h.last_tick_summary.errors || []).length ? <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">Last clock run: {h.last_tick_summary.errors.join(" · ")}</div> : null}
            {h.last_tick_summary && (h.last_tick_summary.health || []).length ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">
                {h.last_tick_summary.health.map((x, k) => (
                  <li key={k}>{x}</li>
                ))}
              </ul>
            ) : null}
            {canEdit ? (
              <Button
                variant="outline"
                className="mt-3"
                onClick={async () => {
                  await call("post", "/studio/run-tick", { force: true }, { success: "Clock run finished" });
                  load();
                  onChanged();
                }}
              >
                <RefreshCw size={14} /> Run the clock now
              </Button>
            ) : null}
          </div>
          {h.failed.length ? (
            <div className="mt-4">
              <div className="mb-1 text-[13px] font-semibold text-red-700">Posts that could not be published</div>
              <ul className="divide-y divide-[#EEF2F7] rounded-lg border border-red-100">
                {h.failed.map((p) => (
                  <li key={p.post_id}>
                    <button type="button" onClick={() => onOpenPost(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] hover:bg-red-50/50">
                      <ChannelBadge channel={p.channel} iconOnly />
                      <span className="tabular-nums text-[#6B7280]">{fmtLocal(p.slot_at, tz)}</span>
                      <span className="min-w-0 flex-1 truncate">{p.topic}</span>
                      <span className="text-xs font-medium text-[#0A7FB8]">Open</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section id="channels" title="Buffer channels" intro="Connect each account in Buffer first, then match it to an EEC channel here.">
          {canEdit ? (
            <Button variant="outline" className="mb-3" onClick={async () => setBuffer(await call("get", "/studio/buffer/channels"))}>
              Load channels from Buffer
            </Button>
          ) : null}
          <ul className="space-y-2">
            {ACTIVE_CHANNELS.map((ch) => (
              <li key={ch} className="flex flex-wrap items-center gap-3 text-[13.5px]">
                <span className="w-48">
                  <ChannelBadge channel={ch} />
                </span>
                {buffer ? (
                  <select className="h-9 min-w-0 flex-1 rounded-lg border border-[#E6EBF2] px-2" value={mapping[ch] || ""} onChange={(e) => setMapping({ ...mapping, [ch]: e.target.value })}>
                    <option value="">Not connected</option>
                    {buffer.channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.service} · {c.displayName || c.name}
                        {c.isDisconnected ? " (disconnected)" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={mapping[ch] ? "text-emerald-700" : "text-[#6B7280]"}>{mapping[ch] ? "Connected" : "Not connected"}</span>
                )}
              </li>
            ))}
          </ul>
          {buffer ? (
            <Button className="mt-3" onClick={() => save("buffer_channels", mapping, "Channels saved")}>
              Save channels
            </Button>
          ) : null}
        </Section>

        <Section id="schedule" title="Schedule" intro="Days and times each channel posts (India time). The writer plans posts into these slots.">
          <CadenceEditor value={s.cadence} disabled={!canEdit} onSave={(v) => save("cadence", v, "Schedule saved")} />
        </Section>

        <Section id="outreach" title="Outreach" intro="When the writer drafts LinkedIn comments on buyers' posts, and how many.">
          {reach ? (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[13.5px]">
                <input type="checkbox" disabled={!canEdit} checked={reach.enabled !== false} onChange={(e) => setReach({ ...reach, enabled: e.target.checked })} /> Draft outreach comments
              </label>
              <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-[#44506A]">
                <DayToggles days={reach.days || []} disabled={!canEdit} onChange={(days) => setReach({ ...reach, days })} />
                <label className="flex items-center gap-1.5">
                  <input type="number" min="1" max="30" disabled={!canEdit} className="h-8 w-16 rounded-lg border border-[#E6EBF2] px-2 tabular-nums" value={reach.per_run || 10} onChange={(e) => setReach({ ...reach, per_run: Number(e.target.value) })} />
                  comments each time
                </label>
              </div>
              {(reach.markets || []).length ? <p className="text-xs text-[#6B7280]">Markets: {reach.markets.join(", ")}</p> : null}
              {canEdit ? (
                <Button variant="outline" disabled={JSON.stringify(reach) === JSON.stringify(s.outreach || {})} onClick={() => save("outreach", reach, "Outreach settings saved")}>
                  Save outreach settings
                </Button>
              ) : null}
            </div>
          ) : null}
        </Section>

        <Section id="reminders" title="Reminders and alerts">
          <p className="text-[13.5px] leading-relaxed text-[#44506A]">
            The approver is reminded every {s.reminders.interval_hours} hours while posts are waiting, from {s.reminders.start_hours_before} hours before the first one, never between {s.reminders.quiet_hours} IST. Posts not approved within {s.late_window_hours} hours of their time are skipped.
          </p>
          <label className="mt-3 flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" disabled={!canEdit} checked={Boolean(s.reminders.enabled)} onChange={(e) => save("reminders", { ...s.reminders, enabled: e.target.checked })} /> Send reminders
          </label>
          <p className="mt-2 text-[13.5px] text-[#44506A]">
            Alerts go to {s.notify_email}. The weekly report goes to {(s.report_recipients || []).join(", ")}.
          </p>
        </Section>

        <Section id="team" title="Team" intro="Viewers can read and comment; editors can also edit and ask for changes; the approver decides what goes out.">
          <ul className="divide-y divide-[#EEF2F7]">
            {h.members.map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-2 py-2 text-[13.5px]">
                <span className="min-w-0">
                  <span className="font-medium">{m.name}</span> <span className="text-[#6B7280]">{m.email}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${m.role === "approver" ? "bg-[#F6EFDC] text-[#8A6A16]" : "bg-slate-100 text-slate-700"}`}>
                  {m.role}
                  {m.active ? "" : " (off)"}
                </span>
              </li>
            ))}
          </ul>
          {isApprover ? (
            <form
              className="mt-3 flex flex-wrap gap-2 border-t border-[#EEF2F7] pt-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await call("post", "/studio/members", member, { success: "Team updated" });
                setMember({ email: "", name: "", role: "viewer" });
                load();
              }}
            >
              <input className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#E6EBF2] px-2 text-sm" placeholder="Email" type="email" required value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} />
              <input className="h-9 w-36 rounded-lg border border-[#E6EBF2] px-2 text-sm" placeholder="Name" value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} />
              <select className="h-9 rounded-lg border border-[#E6EBF2] px-2 text-sm" value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })}>
                {["viewer", "editor", "approver"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <Button type="submit" variant="outline">
                Add or update
              </Button>
            </form>
          ) : (
            <p className="mt-2 text-xs text-[#6B7280]">Only the approver can change the team.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
