const { getSupabase } = require("../../db/supabaseClient");

function throwIfError(error) {
  if (error) throw error;
}

async function upsertByEmail(record) {
  const { data, error } = await getSupabase()
    .from("newsletter_subscribers")
    .upsert(record, { onConflict: "email" })
    .select()
    .single();
  throwIfError(error);
  return data;
}

async function listAll() {
  const { data, error } = await getSupabase()
    .from("newsletter_subscribers")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(500);
  throwIfError(error);
  return data;
}

module.exports = { upsertByEmail, listAll };
