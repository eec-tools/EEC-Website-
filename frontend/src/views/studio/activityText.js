// Turns log entries into plain sentences: "Writer drafted 6 outreach comments" instead of "claude · outreach.drafted".

const JOBS = {
  revise: "made the changes the team asked for",
  recheck: "re-checked the facts in queued posts",
  notes: "wrote notes on competitor posts and who engaged",
  competitors: "checked competitors",
  learning: "decided this week's social learnings",
  outreach: "drafted outreach comments",
  research: "researched news for buyers",
  plan_week: "planned next week",
  report: "wrote the weekly report",
};

export function actorName(actor, members) {
  if (!actor || actor === "claude") return "Writer";
  if (actor === "system") return "Studio";
  const m = (members || []).find((x) => x.email === actor);
  if (m && m.name) return m.name.split(" ")[0];
  const local = String(actor).split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function kindOf(action) {
  const a = String(action || "");
  if (a.startsWith("job.")) return "writer";
  if (a.startsWith("post.") || a.startsWith("batch.") || a.startsWith("comment.") || a.startsWith("metrics.") || a.startsWith("engagers.")) return "posts";
  if (a.startsWith("outreach.")) return "outreach";
  if (a.startsWith("rule.") || a.startsWith("learning.")) return "learning";
  if (a.startsWith("competitors.")) return "competitors";
  if (a.startsWith("email.")) return "email";
  return "settings";
}

// Returns { who, text, detail } for one log row. postTopic(id) gives a post's topic when it is known.
export function describe(row, { postTopic = () => null, members } = {}) {
  const who = actorName(row.actor, members);
  const d = row.detail || {};
  const a = String(row.action || "");
  const topic = postTopic(row.target);
  const on = topic ? `: ${topic}` : "";
  const n = (x, one, many) => `${x} ${x === 1 ? one : many}`;
  if (a.startsWith("job.")) {
    const job = a.slice(4);
    return { who, text: JOBS[job] || job.replace(/_/g, " "), detail: d.summary || "", sources: d.sources };
  }
  const T = {
    "post.approved": `approved a post${on}`,
    "post.unapproved": `unapproved a post${on}`,
    "post.edited": `edited a post${on}`,
    "post.dropped": `dropped a post${on}`,
    "post.posted": `published a post${on}`,
    "post.post_now": `published a post straight away${on}`,
    "post.missed": `skipped a post that was not approved in time${on}`,
    "post.send_failed": `could not send a post to Buffer${on}`,
    "post.scheduled_dry_run": `queued a post (dry run, nothing sent)${on}`,
    "post.unscheduled": `took a post out of the Buffer queue${on}`,
    "post.deleted_in_buffer": `found a post deleted in Buffer${on}`,
    "post.change_requested": `asked for a change${on}`,
    "post.change_requested_again": `asked again for a change${on}`,
    "post.change_cancelled": `cancelled a change request${on}`,
    "post.change_failed": `could not make a requested change${on}`,
    "post.revised": `made a requested change${on}`,
    "post.fact_checked": `re-checked the facts${on}`,
    "batch.submitted": `sent ${d.count ? n(d.count, "post", "posts") : "posts"} for approval`,
    "batch.approved": "approved a week of posts",
    "batch.deleted": "deleted a batch of posts",
    "comment.added": `added a note${on}`,
    "metrics.entered": `entered results${on}`,
    "engagers.added": `logged who engaged${on}`,
    "rule.added": "added a writing rule",
    "rule.updated": "changed a writing rule",
    "learning.rule.confirm": "confirmed a writing rule",
    "learning.rule.discard": "discarded a writing rule",
    "learning.competitor.confirm": "approved a competitor learning",
    "learning.competitor.discard": "discarded a competitor learning",
    "competitors.checked": `checked ${row.target || "a competitor"}${d.posts || d.learnings ? `: ${n(d.posts || 0, "post", "posts")} saved, ${n(d.learnings || 0, "learning", "learnings")} filed` : ""}`,
    "outreach.drafted": `drafted ${n(d.saved || 0, "outreach comment", "outreach comments")}${d.checked ? ` after reading ${n(d.checked, "buyer page", "buyer pages")}` : ""}`,
    "outreach.targets.added": `added ${n((d.added || []).length, "buyer", "buyers")} to Outreach${(d.added || []).length ? `: ${(d.added || []).slice(0, 3).join(", ")}${(d.added || []).length > 3 ? "…" : ""}` : ""}`,
    "outreach.posted": `posted an outreach comment${d.target ? ` on ${d.target}'s post` : ""}`,
    "outreach.skip": `skipped an outreach comment${d.target ? ` for ${d.target}` : ""}`,
    "outreach.rewrite": `asked for a new version of a comment${d.target ? ` for ${d.target}` : ""}`,
    "outreach.edit": `edited an outreach comment${d.target ? ` for ${d.target}` : ""}`,
    "outreach.outcome": `marked an outreach result${d.outcome ? `: ${{ none: "no reply", reply: "they replied", conversation: "a conversation", enquiry: "an enquiry" }[d.outcome] || d.outcome}` : ""}`,
    "outreach.undo": "moved an outreach comment back to Ready",
    "outreach.target.updated": "updated an Outreach buyer",
    "member.saved": "changed the team",
    "setting.changed": `changed a setting${d.key ? `: ${String(d.key).replace(/_/g, " ")}` : ""}`,
    "enquiry.removed": "removed an enquiry",
  };
  if (T[a]) return { who, text: T[a], detail: d.reason || d.note || "" };
  if (a.startsWith("email.")) return { who, text: `sent an email: ${d.subject || a.slice(6).replace(/_/g, " ")}`, detail: "" };
  if (a.startsWith("competitors.")) return { who, text: `updated the competitor list${row.target ? `: ${row.target}` : ""}`, detail: "" };
  return { who, text: a.replace(/[._]/g, " "), detail: d.summary || d.reason || "" };
}
