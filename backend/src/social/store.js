// Tiny table-access layer for the social engine, with two interchangeable backends:
// Supabase (production) and an in-memory store (local development and tests).
//
// where: { col: value }               equals
//        { col: { in: [..] } }        one of
//        { col: { neq|gt|gte|lt|lte: v } }
//        { col: { is: null } }        is null
// order: [col, "asc" | "desc"]

const { getSupabase } = require("../db/supabaseClient");

const KEYS = {
  social_config: "key",
  social_members: "email",
  social_batches: "batch_id",
  social_posts: "post_id",
  social_post_versions: "id",
  social_comments: "comment_id",
  social_preferences: "id",
  social_research: "id",
  social_learning: "id",
  social_metrics: "id",
  social_inbox: "id",
  social_competitors: "name",
  social_audit: "id",
  social_competitor_people: "id",
  social_competitor_posts: "id",
  social_enquiries: "id",
  social_engagers: "id",
  social_competitor_learnings: "id",
};

// ---------- Supabase ----------
function applyWhere(q, where = {}) {
  for (const [col, cond] of Object.entries(where)) {
    if (cond !== null && typeof cond === "object" && !Array.isArray(cond) && !(cond instanceof Date)) {
      if ("in" in cond) q = q.in(col, cond.in);
      if ("neq" in cond) q = q.neq(col, cond.neq);
      if ("gt" in cond) q = q.gt(col, cond.gt);
      if ("gte" in cond) q = q.gte(col, cond.gte);
      if ("lt" in cond) q = q.lt(col, cond.lt);
      if ("lte" in cond) q = q.lte(col, cond.lte);
      if ("notIn" in cond) q = q.not(col, "in", `(${cond.notIn.map((v) => `"${v}"`).join(",")})`);
      if ("is" in cond) q = q.is(col, cond.is);
    } else {
      q = q.eq(col, cond);
    }
  }
  return q;
}

function check(res) {
  if (res.error) {
    const err = new Error(res.error.message);
    err.code = res.error.code;
    throw err;
  }
  return res.data;
}

const supabaseStore = {
  async list(table, { where, order, limit } = {}) {
    let q = applyWhere(getSupabase().from(table).select("*"), where);
    if (order) q = q.order(order[0], { ascending: order[1] !== "desc" });
    if (limit) q = q.limit(limit);
    return check(await q);
  },
  async get(table, key) {
    const res = await getSupabase().from(table).select("*").eq(KEYS[table], key).maybeSingle();
    return check(res);
  },
  async insert(table, rows) {
    return check(await getSupabase().from(table).insert(rows).select("*"));
  },
  async upsert(table, rows) {
    return check(await getSupabase().from(table).upsert(rows, { onConflict: KEYS[table] }).select("*"));
  },
  // Compare-and-set: only rows matching `where` change. Returns the updated rows.
  async update(table, where, patch) {
    return check(await applyWhere(getSupabase().from(table).update(patch), where).select("*"));
  },
  async remove(table, where) {
    return check(await applyWhere(getSupabase().from(table).delete(), where).select("*"));
  },
};

// ---------- In memory ----------
function matches(row, where = {}) {
  return Object.entries(where).every(([col, cond]) => {
    const v = row[col];
    if (cond !== null && typeof cond === "object" && !Array.isArray(cond) && !(cond instanceof Date)) {
      const cmp = (a, b) => (a instanceof Date ? a.getTime() : typeof a === "string" && /^\d{4}-\d\d-\d\d/.test(a) ? Date.parse(a) : a) -
        (b instanceof Date ? b.getTime() : typeof b === "string" && /^\d{4}-\d\d-\d\d/.test(b) ? Date.parse(b) : b);
      if ("in" in cond && !cond.in.includes(v)) return false;
      if ("notIn" in cond && cond.notIn.includes(v)) return false;
      if ("neq" in cond && v === cond.neq) return false;
      if ("is" in cond && !(v === null || v === undefined)) return false;
      if ("gt" in cond && !(v != null && cmp(v, cond.gt) > 0)) return false;
      if ("gte" in cond && !(v != null && cmp(v, cond.gte) >= 0)) return false;
      if ("lt" in cond && !(v != null && cmp(v, cond.lt) < 0)) return false;
      if ("lte" in cond && !(v != null && cmp(v, cond.lte) <= 0)) return false;
      return true;
    }
    return v === cond;
  });
}

function createMemoryStore() {
  const tables = {};
  const seq = {};
  const t = (name) => (tables[name] = tables[name] || []);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const withKey = (table, row) => {
    const key = KEYS[table];
    if (key === "id" && row.id == null) {
      seq[table] = (seq[table] || 0) + 1;
      return { ...row, id: seq[table] };
    }
    return row;
  };
  const uniqueViolation = (table, row, ignore) => {
    // Mirror the two partial unique indexes on social_posts.
    if (table !== "social_posts") return false;
    const live = (r) => !["dropped", "missed", "failed"].includes(r.status);
    return t(table).some(
      (r) =>
        r !== ignore &&
        ((live(r) && live(row) && r.channel === row.channel && Date.parse(r.slot_at) === Date.parse(row.slot_at)) ||
          (row.buffer_id && r.buffer_id === row.buffer_id))
    );
  };
  const fail = () => {
    const e = new Error("duplicate key value violates unique constraint");
    e.code = "23505";
    throw e;
  };

  return {
    tables,
    async list(table, { where, order, limit } = {}) {
      let rows = t(table).filter((r) => matches(r, where));
      if (order) {
        const [col, dir] = order;
        rows = [...rows].sort((a, b) => {
          const av = a[col], bv = b[col];
          const r = av == null ? -1 : bv == null ? 1 : av < bv ? -1 : av > bv ? 1 : 0;
          return dir === "desc" ? -r : r;
        });
      }
      if (limit) rows = rows.slice(0, limit);
      return clone(rows);
    },
    async get(table, key) {
      const row = t(table).find((r) => r[KEYS[table]] === key);
      return row ? clone(row) : null;
    },
    async insert(table, rows) {
      const list = (Array.isArray(rows) ? rows : [rows]).map((r) => withKey(table, clone(r)));
      for (const r of list) {
        if (KEYS[table] !== "id" && t(table).some((x) => x[KEYS[table]] === r[KEYS[table]])) fail();
        if (uniqueViolation(table, r)) fail();
      }
      t(table).push(...list);
      return clone(list);
    },
    async upsert(table, rows) {
      const out = [];
      for (const r of Array.isArray(rows) ? rows : [rows]) {
        const i = t(table).findIndex((x) => x[KEYS[table]] === r[KEYS[table]]);
        if (i >= 0) t(table)[i] = { ...t(table)[i], ...clone(r) };
        else t(table).push(withKey(table, clone(r)));
        out.push(clone(i >= 0 ? t(table)[i] : t(table)[t(table).length - 1]));
      }
      return out;
    },
    async update(table, where, patch) {
      const out = [];
      for (let i = 0; i < t(table).length; i++) {
        if (matches(t(table)[i], where)) {
          const next = { ...t(table)[i], ...clone(patch) };
          if (uniqueViolation(table, next, t(table)[i])) fail();
          t(table)[i] = next;
          out.push(clone(next));
        }
      }
      return out;
    },
    async remove(table, where) {
      const keep = [], gone = [];
      for (const r of t(table)) (matches(r, where) ? gone : keep).push(r);
      tables[table] = keep;
      return clone(gone);
    },
  };
}

let active = null;
function getStore() {
  if (active) return active;
  const repos = require("../repositories");
  active = repos.getMode() === "postgres" ? supabaseStore : createMemoryStore();
  return active;
}
function setStore(store) {
  active = store;
}

module.exports = { getStore, setStore, createMemoryStore, supabaseStore, KEYS };
