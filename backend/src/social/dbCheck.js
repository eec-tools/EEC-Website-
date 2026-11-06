// Checks that the database has the tables and columns the code expects, so Studio can say
// "run the database update" instead of failing with a bare 500.
const { getSupabase } = require("../db/supabaseClient");

const DIR = "backend/sql/migrations/";
const MIGRATION = `${DIR}2026-11-05-studio-feedback.sql`;

// [table, columns the code reads or writes]
const CHECKS = [
  ["social_posts", "format,segment,change_request", "2026-11-05-studio-feedback.sql"],
  ["social_competitors", "linkedin_url,added_by,updated_at,created_at", "2026-11-05-studio-feedback.sql"],
  ["social_competitor_people", "id,name,role,company,linkedin_url,topics,notes,active,added_by,created_at,updated_at", "2026-11-05-studio-feedback.sql"],
  ["social_competitor_posts", "id,url,author,author_type,posted_on,format,hook,body,reactions,why_it_works,noted_at,added_by,created_at", "2026-11-05-studio-feedback.sql"],
  ["social_enquiries", "id,received_at,channel,keyword,post_id,company,contact_name,country,audience,product,status,notes,added_by,created_at,updated_at", "2026-11-05-studio-feedback.sql"],
  ["social_engagers", "id,post_id,name,headline,action,type,role,seniority,company,follow_up,note,classified_at,added_by,created_at", "2026-11-05-studio-feedback.sql"],
  ["social_competitors", "checked_at,check_summary,updated_by,instagram_url,facebook_url", "2026-11-06-competitor-learning.sql"],
  ["social_competitor_people", "checked_at,check_summary,updated_by", "2026-11-06-competitor-learning.sql"],
  ["social_competitor_posts", "source,summary", "2026-11-06-competitor-learning.sql"],
  ["social_competitor_learnings", "id,competitor,text,domain,channel,rule_type,evidence,status,decided_by,decision_note,decided_at,created_at", "2026-11-06-competitor-learning.sql"],
  ["social_preferences", "domain,decided_by,decision_note,decided_at", "2026-11-06-competitor-learning.sql"],
];

// Postgres "relation/column does not exist" and PostgREST "not in the schema cache".
function isMissingSchema(err) {
  if (!err) return false;
  if (["42P01", "42703", "PGRST204", "PGRST205"].includes(err.code)) return true;
  return /does not exist|could not find the .* in the schema cache/i.test(String(err.message || ""));
}

const MESSAGE = `A database update for the new Studio features has not been run yet. Run the update files in ${DIR} that Studio lists (in date order) in Supabase (SQL editor), then reload this page.`;

let cache = null; // { at, missing }

async function missingSchema({ fresh = false } = {}) {
  const repos = require("../repositories");
  if (repos.getMode() !== "postgres") return [];
  // Once everything is there it stays there; a missing result is re-checked after 30 seconds.
  if (!fresh && cache && (cache.missing.length === 0 || Date.now() - cache.at < 30000)) return cache.missing;
  const sb = getSupabase();
  const results = await Promise.all(
    CHECKS.map(async ([table, cols, file]) => {
      const res = await sb.from(table).select(cols).limit(1);
      return res.error && isMissingSchema(res.error) ? `${file}: ${table}: ${res.error.message}` : null;
    })
  );
  cache = { at: Date.now(), missing: results.filter(Boolean) };
  return cache.missing;
}

// The update files still to run, oldest first.
function filesFor(missing) {
  return [...new Set((missing || []).map((m) => `${DIR}${String(m).split(":")[0]}`))].sort();
}

module.exports = { missingSchema, isMissingSchema, filesFor, MESSAGE, MIGRATION };
