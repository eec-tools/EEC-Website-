const { getSupabase } = require("../../db/supabaseClient");

function throwIfError(error) {
  if (error) throw error;
}

async function create(record) {
  const { data, error } = await getSupabase()
    .from("password_reset_tokens")
    .insert(record)
    .select()
    .single();
  throwIfError(error);
  return data;
}

async function findValidByToken(token) {
  const { data, error } = await getSupabase()
    .from("password_reset_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .maybeSingle();
  throwIfError(error);
  return data;
}

async function markUsed(token) {
  const { data, error } = await getSupabase()
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("token", token)
    .select()
    .single();
  throwIfError(error);
  return data;
}

module.exports = { create, findValidByToken, markUsed };
