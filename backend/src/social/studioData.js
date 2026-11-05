// Studio lists the team edits by hand: competitors (companies, people, best posts), enquiries
// and the people who engaged with a post. Plus the run log (Activity tab) and format results.
const { z } = require("zod");
const HttpError = require("../utils/httpError");
const { getStore } = require("./store");
const { audit } = require("./settings");
const service = require("./service");
const { FORMATS, FORMAT_KEYS } = require("./formats");
const { isMissingSchema } = require("./dbCheck");

// A table from a database update that has not been run yet reads as empty, so the rest of the page works.
const orEmpty = (promise) => promise.catch((e) => { if (isMissingSchema(e)) return null; throw e; });

function parse(schema, input) {
  const r = schema.safeParse(input || {});
  if (!r.success) throw new HttpError(422, r.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "));
  return r.data;
}
const opt = (n) => z.string().trim().max(n).optional().nullable();
const url = z.string().trim().max(500).optional().nullable();

// ---------------- competitors ----------------
const LISTS = {
  companies: {
    table: "social_competitors",
    key: "name",
    schema: z.object({
      name: z.string().trim().min(2).max(120),
      linkedin_url: url,
      url,
      category: opt(80),
      focus: opt(400),
      notes: opt(1000),
      active: z.boolean().optional(),
    }),
  },
  people: {
    table: "social_competitor_people",
    key: "id",
    schema: z.object({
      name: z.string().trim().min(2).max(120),
      role: opt(120),
      company: opt(120),
      linkedin_url: url,
      topics: opt(300),
      notes: opt(1000),
      active: z.boolean().optional(),
    }),
  },
  posts: {
    table: "social_competitor_posts",
    key: "id",
    schema: z.object({
      url,
      author: z.string().trim().min(2).max(120),
      author_type: z.enum(["company", "person"]).optional().nullable(),
      posted_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
      format: opt(60),
      hook: opt(400),
      body: z.string().trim().max(6000).optional().nullable(),
      reactions: opt(200),
    }),
  },
};

async function listCompetitors() {
  const store = getStore();
  const [companies, people, posts] = await Promise.all([
    store.list("social_competitors", { order: ["name", "asc"] }),
    orEmpty(store.list("social_competitor_people", { order: ["name", "asc"] })),
    orEmpty(store.list("social_competitor_posts", { order: ["created_at", "desc"], limit: 200 })),
  ]);
  return { companies, people: people || [], posts: posts || [], db_update_needed: people === null || posts === null };
}

async function saveCompetitor(member, list, raw, id) {
  service.requireRole(member, ["approver", "editor"]);
  const def = LISTS[list];
  if (!def) throw new HttpError(404, "Unknown list");
  const data = parse(def.schema, raw);
  const store = getStore();
  const at = new Date().toISOString();
  let row;
  if (id !== undefined && id !== null && id !== "") {
    const key = def.key === "id" ? Number(id) : String(id);
    if (list === "companies" && data.name !== key) {
      // Renamed: the name is the key, so replace the row.
      const old = await store.get(def.table, key);
      if (!old) throw new HttpError(404, "Not found");
      await store.remove(def.table, { name: key });
      [row] = await store.insert(def.table, { ...old, ...data, added_by: old.added_by || member.email, updated_at: at });
    } else {
      // A changed post text needs a fresh note from the engine.
      const patch = list === "posts" ? { ...data, why_it_works: null, noted_at: null } : { ...data, updated_at: at };
      [row] = await store.update(def.table, { [def.key]: key }, patch);
      if (!row) throw new HttpError(404, "Not found");
    }
  } else {
    if (list === "companies" && (await store.get(def.table, data.name))) throw new HttpError(409, `${data.name} is already on the list.`);
    [row] = await store.insert(def.table, { ...data, active: data.active !== false, added_by: member.email, created_at: at, ...(list !== "posts" ? { updated_at: at } : {}) });
  }
  await audit(member.email, `competitors.${list}.saved`, String(row[def.key]), {});
  return row;
}

async function removeCompetitor(member, list, id) {
  service.requireRole(member, ["approver", "editor"]);
  const def = LISTS[list];
  if (!def) throw new HttpError(404, "Unknown list");
  const key = def.key === "id" ? Number(id) : String(id);
  const gone = await getStore().remove(def.table, { [def.key]: key });
  if (!gone.length) throw new HttpError(404, "Not found");
  await audit(member.email, `competitors.${list}.removed`, String(id), {});
  return { ok: true };
}

// ---------------- enquiries ----------------
const enquirySchema = z.object({
  received_at: z.string().max(40).optional().nullable(),
  channel: z.enum(["linkedin", "instagram", "facebook", "email", "website", "whatsapp", "phone", "other"]).optional().nullable(),
  keyword: opt(40),
  post_id: opt(60),
  company: opt(160),
  contact_name: opt(120),
  country: opt(80),
  audience: z.enum(["buyer", "supplier", "other"]).optional().nullable(),
  product: opt(160),
  status: z.enum(["new", "qualified", "quoted", "won", "lost"]).optional(),
  notes: opt(2000),
});

// Every post asks people to message a keyword ("SHRIMP"); an enquiry with that keyword is linked
// to the most recent post that used it.
async function postForKeyword(keyword) {
  if (!keyword) return null;
  const k = String(keyword).trim().toUpperCase();
  if (k.length < 3) return null;
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const posts = await getStore().list("social_posts", { where: { status: { in: ["posted", "scheduled"] }, slot_at: { gte: since } }, order: ["slot_at", "desc"] });
  const re = new RegExp(`\\b${k.replace(/[^A-Z0-9]/g, "")}\\b`);
  const hit = posts.find((p) => re.test(String(p.body || "")));
  return hit ? hit.post_id : null;
}

async function listEnquiries({ days = 90 } = {}) {
  const since = new Date(Date.now() - Math.min(Number(days) || 90, 730) * 86400000).toISOString();
  return (await orEmpty(getStore().list("social_enquiries", { where: { received_at: { gte: since } }, order: ["received_at", "desc"], limit: 500 }))) || [];
}

async function saveEnquiry(member, raw, id) {
  service.requireRole(member, ["approver", "editor"]);
  const data = parse(enquirySchema, raw);
  const store = getStore();
  const at = new Date().toISOString();
  if (data.keyword) data.keyword = data.keyword.toUpperCase();
  if (!data.post_id && data.keyword) data.post_id = await postForKeyword(data.keyword);
  let row;
  if (id) {
    [row] = await store.update("social_enquiries", { id: Number(id) }, { ...data, updated_at: at });
    if (!row) throw new HttpError(404, "Enquiry not found");
  } else {
    [row] = await store.insert("social_enquiries", { status: "new", ...data, received_at: data.received_at || at, added_by: member.email, created_at: at, updated_at: at });
  }
  await audit(member.email, id ? "enquiry.updated" : "enquiry.added", String(row.id), { post_id: row.post_id });
  return row;
}

async function removeEnquiry(member, id) {
  service.requireRole(member, ["approver", "editor"]);
  const gone = await getStore().remove("social_enquiries", { id: Number(id) });
  if (!gone.length) throw new HttpError(404, "Enquiry not found");
  await audit(member.email, "enquiry.removed", String(id), {});
  return { ok: true };
}

// ---------------- engagers ----------------
// The team pastes people from a post's notifications, one per line: "Name - Headline" (or a tab
// or a vertical bar between the two). The scheduled task sorts them into buyer, supplier or other.
function parseEngagers(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2)
    .slice(0, 200)
    .map((l) => {
      // Split at the first separator only: " - ", " | ", or a tab.
      const m = l.match(/^(.*?)(?:\s+[-–—]\s+|\s*\|\s*|\t)(.*)$/);
      return m ? { name: m[1].trim().slice(0, 120), headline: m[2].trim().slice(0, 300) || null } : { name: l.slice(0, 120), headline: null };
    });
}

async function addEngagers(member, { post_id, text, action }) {
  service.requireRole(member, ["approver", "editor"]);
  const post = await getStore().get("social_posts", post_id);
  if (!post) throw new HttpError(404, "Post not found");
  const people = parseEngagers(text);
  if (!people.length) throw new HttpError(422, "Paste at least one name, one per line.");
  const at = new Date().toISOString();
  const kind = ["reaction", "comment", "share", "message"].includes(action) ? action : "reaction";
  const rows = await getStore().insert("social_engagers", people.map((p) => ({ ...p, post_id, action: kind, added_by: member.email, created_at: at })));
  await audit(member.email, "engagers.added", post_id, { count: rows.length });
  return rows;
}

async function listEngagers(postId) {
  return (await orEmpty(getStore().list("social_engagers", { where: { post_id: postId }, order: ["created_at", "asc"] }))) || [];
}

async function updateEngager(member, id, raw) {
  service.requireRole(member, ["approver", "editor"]);
  const data = parse(
    z.object({
      type: z.enum(["buyer", "supplier", "other"]).optional().nullable(),
      role: opt(120),
      seniority: opt(60),
      company: opt(160),
      follow_up: z.boolean().optional().nullable(),
      note: opt(500),
    }),
    raw
  );
  const [row] = await getStore().update("social_engagers", { id: Number(id) }, data);
  if (!row) throw new HttpError(404, "Not found");
  return row;
}

async function removeEngager(member, id) {
  service.requireRole(member, ["approver", "editor"]);
  await getStore().remove("social_engagers", { id: Number(id) });
  return { ok: true };
}

// ---------------- activity (run log) ----------------
async function listActivity({ days = 30 } = {}) {
  const since = new Date(Date.now() - Math.min(Number(days) || 30, 90) * 86400000).toISOString();
  const rows = await getStore().list("social_audit", { where: { at: { gte: since } }, order: ["at", "desc"], limit: 1000 });
  return rows
    .filter((r) => String(r.action || "").startsWith("job."))
    .slice(0, 300)
    .map((r) => ({ at: r.at, job: r.action.slice(4), summary: (r.detail || {}).summary || "", sources: (r.detail || {}).sources || [] }));
}

// ---------------- format and enquiry results ----------------
// Rows for many posts, 100 ids per request so the request URL stays short.
async function listIn(table, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 100) out.push(...(await getStore().list(table, { where: { post_id: { in: ids.slice(i, i + 100) } } })));
  return out;
}

async function insightsExtra(posts) {
  const store = getStore();
  const ids = posts.map((p) => p.post_id);
  let [enquiries, engagers] = ids.length
    ? await Promise.all([orEmpty(listIn("social_enquiries", ids)), orEmpty(listIn("social_engagers", ids))])
    : [[], []];
  const dbUpdateNeeded = enquiries === null || engagers === null;
  enquiries = enquiries || [];
  engagers = engagers || [];
  const per = {};
  for (const p of posts) per[p.post_id] = { enquiries: 0, buyer: 0, supplier: 0, other: 0, unsorted: 0, people: 0 };
  for (const e of enquiries) if (per[e.post_id]) per[e.post_id].enquiries += 1;
  for (const g of engagers) {
    const o = per[g.post_id];
    if (!o) continue;
    o.people += 1;
    o[g.type || "unsorted"] += 1;
  }
  const byFormat = {};
  for (const p of posts.filter((x) => x.status === "posted")) {
    const k = p.format || "not set";
    const o = (byFormat[k] = byFormat[k] || { label: (FORMATS[k] || {}).label || k, posts: 0, impressions: 0, reactions: 0, comments: 0, saves: 0, enquiries: 0, buyers: 0 });
    const m = p.metrics || {};
    o.posts += 1;
    for (const f of ["impressions", "reactions", "comments", "saves"]) o[f] += Number(m[f]) || 0;
    o.enquiries += per[p.post_id].enquiries;
    o.buyers += per[p.post_id].buyer;
  }
  for (const o of Object.values(byFormat)) {
    const k = o.impressions / 1000;
    o.per_1000 = k > 0 ? { reactions: +(o.reactions / k).toFixed(1), comments: +(o.comments / k).toFixed(1), saves: +(o.saves / k).toFixed(1), enquiries: +(o.enquiries / k).toFixed(2) } : null;
  }
  return { per_post: per, by_format: byFormat, formats: FORMAT_KEYS.map((k) => ({ key: k, label: FORMATS[k].label })), db_update_needed: dbUpdateNeeded };
}

module.exports = {
  listCompetitors,
  saveCompetitor,
  removeCompetitor,
  listEnquiries,
  saveEnquiry,
  removeEnquiry,
  postForKeyword,
  parseEngagers,
  addEngagers,
  listEngagers,
  updateEngager,
  removeEngager,
  listActivity,
  insightsExtra,
};
