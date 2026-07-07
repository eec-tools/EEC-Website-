const { getSupabase } = require("../../db/supabaseClient");

async function create(record) {
  const { data, error } = await getSupabase().from("leads").insert(record).select().single();
  if (error) throw error;
  return data;
}

module.exports = { create };
