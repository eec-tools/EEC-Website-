const { getSupabase } = require("../../db/supabaseClient");

function throwIfError(error) {
  if (error) throw error;
}

// Dedupe on the table's unique email constraint: re-subscribing just refreshes
// source_page/submitted_at instead of creating a second row or erroring.
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
