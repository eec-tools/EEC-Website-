"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, ExternalLink } from "lucide-react";
import { Button, Card, Empty, call, fmtLocal, useAsk } from "./shared";
import { DomainChip, DecideButtons, DecidedLine } from "./LearningItems";

const input = "w-full rounded border border-[#E5EBF2] px-2 py-1 text-sm";

// A small add/edit form built from a field list.
function RowForm({ fields, initial = {}, onSave, onCancel, saveLabel = "Save" }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-2 rounded-md border border-[#E5EBF2] bg-[#F5F9FC] p-3 sm:grid-cols-2">
      {fields.map(([key, label, kind, options]) => (
        <label key={key} className={`text-xs text-[#3A4759] ${kind === "textarea" ? "sm:col-span-2" : ""}`}>
          {label}
          {kind === "textarea" ? (
            <textarea className={`${input} mt-0.5`} rows={5} value={v[key] || ""} onChange={(e) => setV({ ...v, [key]: e.target.value })} />
          ) : kind === "select" ? (
            <select className={`${input} mt-0.5`} value={v[key] || ""} onChange={(e) => setV({ ...v, [key]: e.target.value || null })}>
              <option value="">Not set</option>
              {options.map(([val, lab]) => (
                <option key={val} value={val}>{lab}</option>
              ))}
            </select>
          ) : (
            <input type={kind === "date" ? "date" : "text"} className={`${input} mt-0.5`} value={v[key] || ""} onChange={(e) => setV({ ...v, [key]: e.target.value })} />
          )}
        </label>
      ))}
      <div className="flex gap-2 sm:col-span-2">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const clean = Object.fromEntries(Object.entries(v).filter(([k, x]) => fields.some((f) => f[0] === k) && x !== "" && x !== undefined));
              await onSave(clean);
            } catch {
              /* toast shown */
            } finally {
              setBusy(false);
            }
          }}
        >
          {saveLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

const LINK = (href, text) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#0096D6] hover:underline">
      {text} <ExternalLink size={12} />
    </a>
  ) : null;

// ---------------- Competitors ----------------
const LISTS = {
  posts: {
    title: "Best posts",
    empty: "No posts saved yet. Paste in a competitor post that worked: the engine notes why at its next run and learns from it.",
    fields: [
      ["author", "Author (company or person)"],
      ["author_type", "Author is a", "select", [["company", "Company"], ["person", "Person"]]],
      ["url", "Link to the post"],
      ["posted_on", "Posted on", "date"],
      ["format", "Format (document, image, text, video...)"],
      ["reactions", "What you saw (reactions, comments)"],
      ["hook", "Opening line"],
      ["body", "Post text (copy it from LinkedIn)", "textarea"],
    ],
    key: "id",
  },
  companies: {
    title: "Companies",
    empty: "No companies yet.",
    fields: [
      ["name", "Company"],
      ["linkedin_url", "LinkedIn page"],
      ["instagram_url", "Instagram profile"],
      ["facebook_url", "Facebook page"],
      ["url", "Website"],
      ["category", "Category (direct competitor, adjacent...)"],
      ["focus", "What they post about"],
      ["notes", "Why we watch them", "textarea"],
    ],
    key: "name",
  },
  people: {
    title: "People",
    empty: "No people yet.",
    fields: [
      ["name", "Name"],
      ["role", "Role"],
      ["company", "Company"],
      ["linkedin_url", "LinkedIn profile"],
      ["topics", "Topics they are known for"],
      ["notes", "Notes", "textarea"],
    ],
    key: "id",
  },
};

// What we learn from competitors. Social learnings (how to post) are decided by the writer; business ones by the team.
function CompetitorLearnings({ rows, tz, canEdit, onDone }) {
  const [showOld, setShowOld] = useState(false);
  const waiting = rows.filter((l) => l.status === "pending" && l.domain === "business");
  const socialPending = rows.filter((l) => l.status === "pending" && l.domain === "social");
  const decided = rows.filter((l) => l.status !== "pending");
  const approved = decided.filter((l) => l.status === "approved");
  const discarded = decided.filter((l) => l.status === "discarded");
  const item = (l, actions) => (
    <li key={l.id} className="py-2.5 text-sm">
      <div className="text-[#111827]">{l.text}</div>
      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
        <DomainChip domain={l.domain} />
        <span>from {l.competitor || "competitors"}</span>
        {l.channel && l.channel !== "all" ? <span>· {l.channel.replace("linkedin_company", "LinkedIn").replace("instagram", "Instagram").replace("facebook", "Facebook")}</span> : null}
        <span>· {fmtLocal(l.created_at, tz)}</span>
      </div>
      {(l.evidence || []).length ? (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {l.evidence.map((e, i) => (
            <span key={i}>{LINK(e.url, e.title || "evidence")}</span>
          ))}
        </div>
      ) : null}
      {actions}
    </li>
  );
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-1 font-semibold text-[#012D76]">
          Waiting for the business team <span className="text-sm font-normal text-[#6B7280]">({waiting.length})</span>
        </div>
        <p className="mb-2 text-xs text-[#6B7280]">What competitors do that touches what EEC says or offers. Approve what EEC should act on; the writer then uses it when planning. Discard the rest.</p>
        {waiting.length ? (
          <ul className="divide-y divide-[#EFF4F9]">
            {waiting.map((l) => item(l, canEdit ? <DecideButtons kind="competitor" item={l} onDone={onDone} confirmLabel="Approve" /> : <div className="mt-1 text-xs text-[#6B7280]">Waiting for an editor or the approver.</div>))}
          </ul>
        ) : (
          <p className="text-sm text-[#6B7280]">Nothing waiting.</p>
        )}
      </Card>
      <Card className="p-4">
        <div className="mb-1 font-semibold text-[#012D76]">
          Approved <span className="text-sm font-normal text-[#6B7280]">({approved.length})</span>
        </div>
        <p className="mb-2 text-xs text-[#6B7280]">Used by the writer when it plans each week. How-to-post learnings are approved by the writer with its reason; change any decision with one click.</p>
        {socialPending.length ? <p className="mb-2 rounded bg-sky-50 px-2 py-1 text-xs text-sky-900">{socialPending.length} new social learning{socialPending.length === 1 ? "" : "s"} will be decided at the writer&apos;s next run.</p> : null}
        {approved.length ? <ul className="divide-y divide-[#EFF4F9]">{approved.map((l) => item(l, <DecidedLine kind="competitor" item={l} tz={tz} canEdit={canEdit} onDone={onDone} />))}</ul> : <p className="text-sm text-[#6B7280]">None yet.</p>}
        {discarded.length ? (
          <button type="button" className="mt-2 text-xs text-[#0096D6] hover:underline" onClick={() => setShowOld(!showOld)}>
            {showOld ? "Hide" : "Show"} {discarded.length} discarded
          </button>
        ) : null}
        {showOld ? <ul className="mt-2 divide-y divide-[#EFF4F9] opacity-80">{discarded.map((l) => item(l, <DecidedLine kind="competitor" item={l} tz={tz} canEdit={canEdit} onDone={onDone} />))}</ul> : null}
      </Card>
    </div>
  );
}

export function CompetitorsTab({ me, tz, onChanged }) {
  const ask = useAsk();
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const [data, setData] = useState(null);
  const [list, setList] = useState("learnings");
  const [editing, setEditing] = useState(null); // "new" or a row
  const load = () => call("get", "/studio/competitors").then(setData).catch(() => setData({ companies: [], people: [], posts: [], learnings: [] }));
  const refresh = () => {
    load();
    onChanged && onChanged();
  };
  useEffect(() => {
    load();
  }, []);
  if (!data) return <Empty title="Loading…" />;
  const def = LISTS[list] || {};
  const rows = data[list] || [];
  const waitingCount = (data.learnings || []).filter((l) => l.status === "pending" && l.domain === "business").length;
  const save = async (values) => {
    if (editing === "new") await call("post", `/studio/competitors/${list}`, values, { success: "Saved" });
    else await call("patch", `/studio/competitors/${list}/${encodeURIComponent(editing[def.key])}`, values, { success: "Saved" });
    setEditing(null);
    load();
  };
  const remove = async (row) => {
    if (!(await ask({ title: "Remove this entry?", confirm: "Remove", danger: true }))) return;
    await call("delete", `/studio/competitors/${list}/${encodeURIComponent(row[def.key])}`, undefined, { success: "Removed" }).catch(() => null);
    load();
  };

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-[#3A4759]">
        The writer checks each company and person about twice a week on public pages (websites, blogs, news, public search results). It updates their details, saves posts it finds with a note on why they work, and files what
        EEC can learn. It cannot log in to LinkedIn, so you can still paste in a LinkedIn post you saw: it writes the note at its next run. It never copies their wording.
      </p>
      <div className="flex flex-wrap items-center gap-1 border-b border-[#E5EBF2]">
        {[["learnings", { title: "Learnings" }], ...Object.entries(LISTS)].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setList(k);
              setEditing(null);
            }}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${list === k ? "border-[#A6831F] text-[#012D76]" : "border-transparent text-[#6B7280]"}`}
          >
            {l.title}{" "}
            {k === "learnings" ? (waitingCount ? <span className="rounded-full bg-[#012D76] px-1.5 text-[11px] text-white">{waitingCount} to decide</span> : null) : `(${(data[k] || []).length})`}
          </button>
        ))}
        {canEdit && list !== "learnings" ? (
          <Button className="ml-auto" variant="outline" onClick={() => setEditing("new")}>
            <Plus size={14} /> Add
          </Button>
        ) : null}
      </div>
      {editing ? <RowForm fields={def.fields} initial={editing === "new" ? {} : editing} onSave={save} onCancel={() => setEditing(null)} /> : null}
      {list === "learnings" ? (
        <CompetitorLearnings rows={data.learnings || []} tz={tz} canEdit={canEdit} onDone={refresh} />
      ) : !rows.length ? (
        <Empty title={def.title}>{def.empty}</Empty>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r[def.key]} className="p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {list === "posts" ? (
                    <>
                      <div className="font-semibold text-[#012D76]">
                        {r.author}
                        {r.author_type ? <span className="ml-2 rounded bg-[#F5F9FC] px-1.5 py-0.5 text-xs font-medium text-[#3A4759]">{r.author_type}</span> : null}
                        {r.source === "engine" ? <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-800">found by the writer</span> : null}
                      </div>
                      <div className="text-xs text-[#6B7280]">{[r.format, r.posted_on, r.reactions, r.added_by && r.added_by !== "writer" && `saved by ${r.added_by}`].filter(Boolean).join(" · ")}</div>
                      {r.hook ? <div className="mt-2 text-[#111827]">“{r.hook}”</div> : null}
                      {r.summary ? <div className="mt-1 text-[#3A4759]">{r.summary}</div> : null}
                      <div className={`mt-2 rounded-md p-2 ${r.why_it_works ? "bg-emerald-50 text-emerald-900" : "bg-[#F5F9FC] text-[#6B7280]"}`}>
                        {r.why_it_works ? (
                          <>
                            <b>Why it works:</b> {r.why_it_works}
                          </>
                        ) : (
                          "The engine writes its note at the next run."
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-[#012D76]">{r.name}</div>
                      <div className="text-xs text-[#6B7280]">{[r.role, r.company, r.category, r.topics, r.focus].filter(Boolean).join(" · ")}</div>
                      {r.notes ? <div className="mt-1 text-[#3A4759]">{r.notes}</div> : null}
                      <div className="mt-1.5 rounded bg-[#F5F9FC] px-2 py-1 text-xs text-[#3A4759]">
                        {r.checked_at ? (
                          <>
                            <b>Checked by the writer</b> {fmtLocal(r.checked_at, tz)}
                            {r.check_summary ? `: ${r.check_summary}` : ""}
                          </>
                        ) : (
                          "The writer checks this at its next daily run."
                        )}
                      </div>
                    </>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {LINK(r.linkedin_url, "LinkedIn")}
                    {LINK(r.instagram_url, "Instagram")}
                    {LINK(r.facebook_url, "Facebook")}
                    {LINK(r.url, list === "posts" ? "Open the post" : "Website")}
                  </div>
                </div>
                {canEdit ? (
                  <div className="flex gap-1">
                    <Button variant="ghost" aria-label="Edit" onClick={() => setEditing(r)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" aria-label="Remove" onClick={() => remove(r)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Activity (run log) ----------------
const JOB_NAMES = {
  revise: "Changes and learning",
  recheck: "Fact check before posting",
  notes: "Competitor notes and engagers",
  competitors: "Competitor watch",
  learning: "Learning decisions",
  research: "Research",
  plan_week: "Plan and write next week",
  report: "Weekly report",
};

export function FormatTable({ data }) {
  const rows = Object.entries(data.by_format || {});
  if (!rows.length) return null;
  return (
    <Card className="overflow-x-auto p-4">
      <div className="mb-1 font-semibold text-[#012D76]">By format</div>
      <p className="mb-2 text-xs text-[#6B7280]">Per 1,000 impressions, so formats compare fairly. The engine leans towards the formats that win once each has run a few times.</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[#6B7280]">
            {["Format", "Posted", "Impressions", "Reactions /1k", "Comments /1k", "Saves /1k", "Enquiries", "Buyers engaged"].map((h) => (
              <th key={h} className="px-2 py-1 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, f]) => (
            <tr key={k} className="border-t border-[#EFF4F9]">
              <td className="px-2 py-1.5 font-medium text-[#012D76]">{f.label}</td>
              <td className="px-2 py-1.5 tabular-nums">{f.posts}</td>
              <td className="px-2 py-1.5 tabular-nums">{f.impressions}</td>
              <td className="px-2 py-1.5 tabular-nums">{f.per_1000 ? f.per_1000.reactions : "–"}</td>
              <td className="px-2 py-1.5 tabular-nums">{f.per_1000 ? f.per_1000.comments : "–"}</td>
              <td className="px-2 py-1.5 tabular-nums">{f.per_1000 ? f.per_1000.saves : "–"}</td>
              <td className="px-2 py-1.5 tabular-nums">{f.enquiries}</td>
              <td className="px-2 py-1.5 tabular-nums">{f.buyers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Insights: enquiries ----------------
const ENQ_FIELDS = [
  ["received_at", "Date", "date"],
  ["channel", "Came in by", "select", [["linkedin", "LinkedIn message"], ["instagram", "Instagram message"], ["facebook", "Facebook message"], ["email", "Email"], ["website", "Website form"], ["whatsapp", "WhatsApp"], ["phone", "Phone"], ["other", "Other"]]],
  ["keyword", "Keyword they used (links it to the post)"],
  ["company", "Company"],
  ["contact_name", "Contact"],
  ["country", "Country"],
  ["audience", "They are a", "select", [["buyer", "Buyer"], ["supplier", "Supplier"], ["other", "Other"]]],
  ["product", "Product"],
  ["status", "Status", "select", [["new", "New"], ["qualified", "Qualified"], ["quoted", "Quoted"], ["won", "Won"], ["lost", "Lost"]]],
  ["notes", "Notes", "textarea"],
];
const STATUS_TONE = { new: "bg-sky-50 text-sky-800", qualified: "bg-amber-50 text-amber-800", quoted: "bg-violet-50 text-violet-800", won: "bg-emerald-50 text-emerald-800", lost: "bg-slate-100 text-slate-600" };

export function EnquiriesPanel({ me, tz, postsById = {} }) {
  const ask = useAsk();
  const canEdit = ["approver", "editor"].includes(me.member.role);
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const load = () => call("get", "/studio/enquiries?days=180").then(setRows).catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);
  const save = async (v) => {
    const body = { ...v, received_at: v.received_at ? new Date(`${String(v.received_at).slice(0, 10)}T06:00:00Z`).toISOString() : undefined };
    if (editing === "new") await call("post", "/studio/enquiries", body, { success: "Enquiry added" });
    else await call("patch", `/studio/enquiries/${editing.id}`, body, { success: "Saved" });
    setEditing(null);
    load();
  };
  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-[#012D76]">Enquiries</div>
          <p className="text-xs text-[#6B7280]">Every enquiry the posts bring in. Enter the keyword they used (&ldquo;SHRIMP&rdquo;) and it is linked to the post that asked for it.</p>
        </div>
        {canEdit ? (
          <Button variant="outline" onClick={() => setEditing("new")}>
            <Plus size={14} /> Add enquiry
          </Button>
        ) : null}
      </div>
      {editing ? <RowForm fields={ENQ_FIELDS} initial={editing === "new" ? { status: "new" } : { ...editing, received_at: String(editing.received_at || "").slice(0, 10) }} onSave={save} onCancel={() => setEditing(null)} /> : null}
      {!rows ? (
        <p className="text-sm text-[#6B7280]">Loading…</p>
      ) : !rows.length ? (
        <p className="text-sm text-[#6B7280]">No enquiries logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#6B7280]">
                {["Date", "Company", "Who", "Product", "From post", "Status", ""].map((h) => (
                  <th key={h} className="px-2 py-1 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#EFF4F9] align-top">
                  <td className="whitespace-nowrap px-2 py-1.5">{fmtLocal(r.received_at, tz, { hour: undefined, minute: undefined, weekday: undefined })}</td>
                  <td className="px-2 py-1.5">
                    <div className="font-medium text-[#111827]">{r.company || "Not given"}</div>
                    <div className="text-xs text-[#6B7280]">{[r.contact_name, r.country, r.channel].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td className="px-2 py-1.5">{r.audience || ""}</td>
                  <td className="px-2 py-1.5">{r.product || ""}</td>
                  <td className="px-2 py-1.5 text-xs">{r.post_id ? (postsById[r.post_id] ? postsById[r.post_id].topic : r.keyword || r.post_id) : r.keyword ? `${r.keyword} (no post found)` : ""}</td>
                  <td className="px-2 py-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_TONE[r.status] || ""}`}>{r.status}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    {canEdit ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" aria-label="Edit enquiry" onClick={() => setEditing(r)}>
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label="Remove enquiry"
                          onClick={async () => {
                            if (!(await ask({ title: "Remove this enquiry?", confirm: "Remove", danger: true }))) return;
                            await call("delete", `/studio/enquiries/${r.id}`).catch(() => null);
                            load();
                          }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
