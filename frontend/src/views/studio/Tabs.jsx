"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button, Card, Empty, CHANNELS, ACTIVE_CHANNELS, call, fmtLocal, ExtLink } from "./shared";
import { DomainChip, DecideButtons, DecidedLine } from "./LearningItems";

// ---------------- Learning ----------------
// Writing rules. Social ones (how to post) are decided by the writer, with a reason the team can undo.
// Business ones (what EEC says) wait here for the business team.
const SOCIAL_TYPES = ["hook", "structure", "length", "hashtags", "timing", "format", "cta", "visual", "topic_more", "topic_less"];
const domainOf = (r) => r.domain || (SOCIAL_TYPES.includes(r.rule_type) ? "social" : "business");

function RuleRow({ r, tz, canEdit, onDone, children, compact = false }) {
  const [open, setOpen] = useState(!compact);
  const meta = (
    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
      <DomainChip domain={domainOf(r)} />
      <span>{r.rule_type}</span>·<span>{r.channel === "all" ? "all channels" : (CHANNELS[r.channel] || {}).label}</span>·<span>from {r.approver}</span>
      {r.evidence_count > 1 ? <span>· seen {r.evidence_count}×</span> : null}
    </div>
  );
  if (compact && !open)
    return (
      <li>
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2 py-2 text-left">
          <ChevronRight size={14} className="flex-none text-[#6B7280]" />
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#0F1B2D]">{r.rule_text}</span>
          <DomainChip domain={domainOf(r)} />
        </button>
      </li>
    );
  return (
    <li className="py-2.5">
      <div className="flex items-start gap-2">
        {compact ? (
          <button type="button" aria-label="Collapse" onClick={() => setOpen(false)} className="mt-0.5 flex-none text-[#6B7280]">
            <ChevronDown size={14} />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-sm text-[#0F1B2D]">{r.rule_text}</div>
          {meta}
          {r.example ? <div className="mt-0.5 text-xs italic text-[#6B7280]">{r.example}</div> : null}
          {children}
          {!children ? <DecidedLine kind="rule" item={r} tz={tz} canEdit={canEdit} onDone={onDone} /> : null}
        </div>
      </div>
    </li>
  );
}

export function LearningTab({ me, tz, onChanged }) {
  const [raw, setData] = useState(null);
  const [adding, setAdding] = useState({ channel: "all", rule_type: "tone", rule_text: "" });
  const [showRetired, setShowRetired] = useState(false);
  const [q, setQ] = useState("");
  const [dom, setDom] = useState("all");
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const load = () => call("get", "/studio/learning").then(setData).catch(() => {});
  const refresh = () => {
    load();
    onChanged && onChanged();
  };
  useEffect(() => {
    load();
  }, []);
  if (!raw) return <Empty title="Loading…" />;
  const monthAgo = Date.now() - 30 * 86400000;
  const query = q.trim().toLowerCase();
  const rulesAll = raw.rules;
  const data = { ...raw, rules: rulesAll.filter((r) => (!query || `${r.rule_text} ${r.rule_type} ${r.example || ""}`.toLowerCase().includes(query)) && (dom === "all" || domainOf(r) === dom)) };
  const business = data.rules.filter((r) => r.status === "candidate" && domainOf(r) === "business");
  const socialPending = data.rules.filter((r) => r.status === "candidate" && domainOf(r) === "social");
  const byWriter = data.rules.filter((r) => r.decided_by === "writer" && r.decided_at && Date.parse(r.decided_at) > monthAgo).sort((a, b) => String(b.decided_at).localeCompare(String(a.decided_at)));
  const standing = data.rules.filter((r) => r.status === "active");
  const retired = data.rules.filter((r) => r.status === "retired");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#E6EBF2] bg-white px-3 sm:max-w-sm">
          <Search size={15} className="text-[#6B7280]" />
          <input className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none" placeholder={`Search ${rulesAll.length} rules`} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="inline-flex overflow-hidden rounded-lg border border-[#E6EBF2] bg-white" role="group" aria-label="Kind of rule">
          {[
            ["all", "All rules"],
            ["business", "What EEC says"],
            ["social", "How to post"],
          ].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={dom === k} onClick={() => setDom(k)} className={`h-9 px-3 text-[13px] font-medium ${dom === k ? "bg-[#012D76] text-white" : "text-[#44506A] hover:bg-[#F5F9FC]"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 space-y-4">
        <Card className="p-4">
          <div className="mb-1 font-semibold text-[#012D76]">
            Waiting for the business team <span className="text-sm font-normal text-[#6B7280]">({business.length})</span>
          </div>
          <p className="mb-2 text-xs text-[#6B7280]">
            Rules about what EEC says and offers: services, claims, tone, audience. The writer noticed them from your edits or comments. Confirm the ones you agree with and they apply to every post; discard the rest. Rules about how to post
            (hooks, formats, length, timing) are decided by the writer itself and listed below, where you can change any decision.
          </p>
          {business.length ? (
            <ul className="divide-y divide-[#EFF4F9]">
              {business.map((r) => (
                <RuleRow key={r.id} r={r} tz={tz} canEdit={canEdit} onDone={refresh}>
                  {canEdit ? <DecideButtons kind="rule" item={r} onDone={refresh} /> : <div className="mt-1 text-xs text-[#6B7280]">Waiting for an editor or the approver.</div>}
                </RuleRow>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6B7280]">Nothing waiting.</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-1 font-semibold text-[#012D76]">
            Decided by the writer, last 30 days <span className="text-sm font-normal text-[#6B7280]">({byWriter.length})</span>
          </div>
          <p className="mb-2 text-xs text-[#6B7280]">How-to-post rules the writer confirmed or discarded, with its reason. Change any decision with one click.</p>
          {socialPending.length ? <p className="mb-2 rounded bg-sky-50 px-2 py-1 text-xs text-sky-900">{socialPending.length} new social rule{socialPending.length === 1 ? "" : "s"} will be decided at the writer&apos;s next run.</p> : null}
          {byWriter.length ? (
            <ul className="divide-y divide-[#EFF4F9]">
              {byWriter.map((r) => (
                <RuleRow key={r.id} r={r} tz={tz} canEdit={canEdit} onDone={refresh} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6B7280]">No decisions yet.</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-2 font-semibold text-[#012D76]">
            Standing rules <span className="text-sm font-normal text-[#6B7280]">({standing.length})</span>
          </div>
          <ul className="divide-y divide-[#EFF4F9]">
            {standing.map((r) => (
              <RuleRow key={r.id} r={r} tz={tz} canEdit={canEdit} onDone={refresh} compact={!query} />
            ))}
          </ul>
          {retired.length ? (
            <button type="button" className="mt-2 text-xs text-[#0096D6] hover:underline" onClick={() => setShowRetired(!showRetired)}>
              {showRetired ? "Hide" : "Show"} {retired.length} retired or discarded
            </button>
          ) : null}
          {showRetired ? (
            <ul className="mt-2 divide-y divide-[#EFF4F9] opacity-80">
              {retired.map((r) => (
                <RuleRow key={r.id} r={r} tz={tz} canEdit={canEdit} onDone={refresh} compact={!query} />
              ))}
            </ul>
          ) : null}
        </Card>
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
                refresh();
              }}
            >
              <Plus size={14} /> Add rule
            </Button>
          </Card>
        ) : null}
      </div>
      <div className="min-w-0 space-y-4">
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
    </div>
  );
}

