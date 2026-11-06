// The writer checks competitors at its daily run: it updates their details, adds public posts it found
// (with a note on why each works) and files what EEC can learn. Learnings wait on the Competitors tab;
// social ones are decided by the writer, business ones by the team (see learning.js).
const HttpError = require("../utils/httpError");
const { getStore } = require("./store");
const { audit } = require("./settings");
const learning = require("./learning");

const STALE_DAYS = 3; // each competitor is looked at about twice a week
const PER_RUN = 3;
const clip = (s, n) => (s == null ? null : String(s).trim().slice(0, n) || null);
const isUrl = (u) => /^https?:\/\/\S+$/i.test(String(u || "").trim());
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const PROFILE_FIELDS = {
  company: { url: 500, linkedin_url: 500, category: 80, focus: 400 },
  person: { role: 120, company: 120, linkedin_url: 500, topics: 300 },
};

async function due(now = new Date(), { limit = PER_RUN } = {}) {
  const store = getStore();
  const cutoff = new Date(now.getTime() - STALE_DAYS * 86400000).toISOString();
  const [companies, people] = await Promise.all([
    store.list("social_competitors", { where: { active: true } }),
    store.list("social_competitor_people", { where: { active: true } }).catch(() => []),
  ]);
  const all = [
    ...companies.map((c) => ({ kind: "company", id: c.name, name: c.name, row: c })),
    ...people.map((p) => ({ kind: "person", id: p.id, name: p.name, row: p })),
  ];
  return all
    .filter((x) => !x.row.checked_at || x.row.checked_at < cutoff)
    .sort((a, b) => String(a.row.checked_at || "").localeCompare(String(b.row.checked_at || "")))
    .slice(0, limit);
}

async function queue(now = new Date()) {
  const store = getStore();
  const list = await due(now);
  const out = [];
  for (const c of list) {
    const posts = await store.list("social_competitor_posts", { where: { author: c.name }, order: ["created_at", "desc"], limit: 40 }).catch(() => []);
    const learned = await store.list("social_competitor_learnings", { where: { competitor: c.name }, order: ["created_at", "desc"], limit: 20 }).catch(() => []);
    const r = c.row;
    out.push({
      kind: c.kind,
      id: c.id,
      name: c.name,
      ...(c.kind === "company" ? { url: r.url, linkedin_url: r.linkedin_url, category: r.category, focus: r.focus } : { role: r.role, company: r.company, linkedin_url: r.linkedin_url, topics: r.topics }),
      team_notes: r.notes,
      last_checked: r.checked_at,
      last_summary: r.check_summary,
      known_post_urls: posts.map((p) => p.url).filter(Boolean),
      learnings_so_far: learned.map((l) => `${l.status}: ${l.text}`),
    });
  }
  return { competitors: out, note: out.length ? undefined : "Every competitor was checked in the last 3 days." };
}

async function saveFindings(input, now = new Date()) {
  const store = getStore();
  const kind = input.kind === "person" ? "person" : "company";
  let row;
  if (kind === "company") row = await store.get("social_competitors", String(input.competitor || input.id || ""));
  else {
    if (input.id) row = await store.get("social_competitor_people", Number(input.id));
    if (!row) row = (await store.list("social_competitor_people", { where: { name: String(input.competitor || "") } }))[0];
  }
  if (!row) throw new HttpError(404, `No ${kind} called ${input.competitor || input.id} on the Competitors tab.`);
  const name = row.name;
  const at = now.toISOString();

  // 1. Details: only the factual fields; the team's own notes are never overwritten.
  const patch = {};
  const before = {};
  for (const [f, n] of Object.entries(PROFILE_FIELDS[kind])) {
    const v = clip((input.profile || {})[f], n);
    if (!v || v === row[f]) continue;
    if (/url$/.test(f) && !isUrl(v)) continue;
    patch[f] = v;
    before[f] = row[f] || null;
  }
  const table = kind === "company" ? "social_competitors" : "social_competitor_people";
  const key = kind === "company" ? { name } : { id: row.id };
  await store.update(table, key, { ...patch, checked_at: at, check_summary: clip(input.summary, 600), updated_by: "writer", updated_at: at });
  if (Object.keys(patch).length) await audit("claude", `competitors.${kind}.updated`, String(row.id || name), { before, after: patch });

  // 2. Posts found on public pages (one row per link).
  const known = new Set((await store.list("social_competitor_posts", { where: { author: name }, limit: 200 })).map((p) => p.url));
  const added = [];
  const skipped = [];
  for (const p of (input.posts || []).slice(0, 5)) {
    const url = clip(p.url, 500);
    if (!isUrl(url)) {
      skipped.push({ url, reason: "needs a public link" });
      continue;
    }
    if (known.has(url) || (await store.list("social_competitor_posts", { where: { url }, limit: 1 })).length) {
      skipped.push({ url, reason: "already saved" });
      continue;
    }
    const [saved] = await store.insert("social_competitor_posts", {
      url,
      author: name,
      author_type: kind,
      posted_on: /^\d{4}-\d{2}-\d{2}$/.test(p.posted_on || "") ? p.posted_on : null,
      format: clip(p.format, 60),
      hook: clip(p.hook, 200),
      summary: clip(p.summary, 600),
      why_it_works: clip(p.why_it_works, 1200),
      noted_at: p.why_it_works ? at : null,
      reactions: clip(p.reactions, 200),
      source: "engine",
      added_by: "writer",
      created_at: at,
    });
    known.add(url);
    added.push(saved.id);
  }

  // 3. Learnings: new ones only; business ones only while the team's list has room.
  const recent = await store.list("social_competitor_learnings", { where: { created_at: { gte: new Date(now.getTime() - 90 * 86400000).toISOString() } } });
  const seen = new Set(recent.map((l) => norm(l.text)));
  const learned = [];
  for (const l of (input.learnings || []).slice(0, 3)) {
    const text = clip(l.text, 600);
    if (!text) continue;
    if (seen.has(norm(text))) {
      skipped.push({ learning: text, reason: "already filed" });
      continue;
    }
    const domain = learning.domainFor(l.rule_type, l.domain);
    if (domain === "business") {
      try {
        await learning.assertBusinessRoom();
      } catch (e) {
        skipped.push({ learning: text, reason: e.message });
        continue;
      }
    }
    const evidence = (Array.isArray(l.evidence) ? l.evidence : [])
      .filter((e) => e && isUrl(e.url))
      .slice(0, 6)
      .map((e) => ({ title: clip(e.title, 200), url: clip(e.url, 500), date: clip(e.date, 20) }));
    if (!evidence.length) {
      skipped.push({ learning: text, reason: "needs at least one public link as evidence" });
      continue;
    }
    const [saved] = await store.insert("social_competitor_learnings", {
      competitor: name,
      text,
      domain,
      channel: ["all", "linkedin_company", "instagram", "facebook"].includes(l.channel) ? l.channel : "all",
      rule_type: clip(l.rule_type, 40),
      evidence,
      status: "pending",
      created_at: at,
    });
    seen.add(norm(text));
    learned.push({ id: saved.id, domain, decided_by: domain === "social" ? "you, in the learning job" : "the business team" });
  }
  await audit("claude", "competitors.checked", name, { posts: added.length, learnings: learned.length });
  return { ok: true, competitor: name, updated_fields: Object.keys(patch), posts_added: added.length, learnings_added: learned, skipped };
}

module.exports = { due, queue, saveFindings, STALE_DAYS, PER_RUN };
