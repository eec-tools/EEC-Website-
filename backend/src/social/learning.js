// Who decides a learning.
//   social   = platform mechanics (hooks, formats, length, hashtags, timing, structure, CTA wording).
//              The writer decides these itself, with a reason; the team can undo any decision in Studio.
//   business = what EEC says and stands for (services, claims, tone, brand, scope, audience, wording).
//              Only the business team decides these.
// Two kinds of learning share this: writing rules (social_preferences) and competitor learnings.
const HttpError = require("../utils/httpError");
const { getStore } = require("./store");
const { audit } = require("./settings");

const SOCIAL_TYPES = ["hook", "structure", "length", "hashtags", "timing", "format", "cta", "visual", "topic_more", "topic_less"];
const BUSINESS_TYPES = ["tone", "brand", "claims", "vocabulary", "phrase", "voice", "topic", "category", "audience", "service", "compliance"];
const MAX_PENDING_BUSINESS = 10; // keeps the team's list short: the writer merges instead of adding more
const SOCIAL_DECIDE_DAYS = 7; // safety net: a social learning nobody decided is discarded after this

const domainFor = (ruleType, given) => (given === "social" || given === "business" ? given : SOCIAL_TYPES.includes(String(ruleType || "").toLowerCase()) ? "social" : "business");
const ruleDomain = (r) => r.domain || domainFor(r.rule_type);

const KINDS = {
  rule: { table: "social_preferences", key: "id", pending: (r) => r.status === "candidate", apply: { confirm: { status: "active" }, discard: { status: "retired" } } },
  competitor: { table: "social_competitor_learnings", key: "id", pending: (r) => r.status === "pending", apply: { confirm: { status: "approved" }, discard: { status: "discarded" } } },
};

// by: 'writer' for the scheduled task, or a team member's email.
async function decide(kind, id, decision, reason, by) {
  const k = KINDS[kind];
  if (!k) throw new HttpError(422, "kind must be rule or competitor");
  if (!["confirm", "discard"].includes(decision)) throw new HttpError(422, "decision must be confirm or discard");
  const store = getStore();
  const row = await store.get(k.table, Number(id));
  if (!row) throw new HttpError(404, "Learning not found");
  const domain = kind === "rule" ? ruleDomain(row) : row.domain;
  if (by === "writer") {
    if (domain !== "social") throw new HttpError(403, "Business learnings are decided by the business team on the Studio page. Leave this one for them.");
    if (!k.pending(row)) return { ok: true, unchanged: true, message: "Already decided." };
    if (!reason || String(reason).trim().length < 10) throw new HttpError(422, "Give a reason in plain words (what evidence supports the decision).");
  }
  const at = new Date().toISOString();
  const patch = { ...k.apply[decision], decided_by: by, decision_note: reason ? String(reason).slice(0, 600) : null, decided_at: at };
  if (kind === "rule") {
    patch.updated_at = at;
    if (!row.domain) patch.domain = domain;
  }
  const [saved] = await store.update(k.table, { [k.key]: Number(id) }, patch);
  await audit(by === "writer" ? "claude" : by, `learning.${kind}.${decision}`, String(id), { domain, reason: patch.decision_note });
  return { ok: true, row: saved };
}

async function pendingBusiness() {
  const store = getStore();
  const [rules, comp] = await Promise.all([
    store.list("social_preferences", { where: { status: "candidate" } }),
    store.list("social_competitor_learnings", { where: { status: "pending", domain: "business" } }).catch(() => []),
  ]);
  return rules.filter((r) => ruleDomain(r) === "business").length + comp.length;
}

async function assertBusinessRoom() {
  const n = await pendingBusiness();
  if (n >= MAX_PENDING_BUSINESS)
    throw new HttpError(
      409,
      `${n} business learnings already wait for the team. Do not add another: strengthen a matching one instead (update_rule with a higher evidence_count, or mention it in your notice).`
    );
}

// Everything the writer still has to decide.
async function socialQueue() {
  const store = getStore();
  const [rules, comp] = await Promise.all([
    store.list("social_preferences", { where: { status: "candidate" }, order: ["id", "asc"] }),
    store.list("social_competitor_learnings", { where: { status: "pending", domain: "social" }, order: ["created_at", "asc"] }).catch(() => []),
  ]);
  return {
    rules: rules.filter((r) => ruleDomain(r) === "social").map((r) => ({ kind: "rule", id: r.id, channel: r.channel, type: r.rule_type, text: r.rule_text, from: r.approver, evidence_count: r.evidence_count, example: r.example, since: r.updated_at })),
    competitor: comp.map((c) => ({ kind: "competitor", id: c.id, competitor: c.competitor, channel: c.channel, type: c.rule_type, text: c.text, evidence: c.evidence, since: c.created_at })),
  };
}

// Safety net (daily): a social learning left undecided for a week is discarded, with a note the team can see and undo.
async function expireSocial(now = new Date()) {
  const store = getStore();
  const cutoff = new Date(now.getTime() - SOCIAL_DECIDE_DAYS * 86400000).toISOString();
  const q = await socialQueue();
  let n = 0;
  for (const it of [...q.rules, ...q.competitor]) {
    if (it.since && it.since < cutoff) {
      await decide(it.kind, it.id, "discard", `Not decided within ${SOCIAL_DECIDE_DAYS} days, so it was set aside. Undo it in Studio if it should apply.`, "writer").catch(() => null);
      n += 1;
    }
  }
  return n;
}

module.exports = { SOCIAL_TYPES, BUSINESS_TYPES, MAX_PENDING_BUSINESS, SOCIAL_DECIDE_DAYS, domainFor, ruleDomain, decide, pendingBusiness, assertBusinessRoom, socialQueue, expireSocial };
