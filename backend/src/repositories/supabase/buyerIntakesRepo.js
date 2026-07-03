const { getSupabase } = require("../../db/supabaseClient");

function throwIfError(error) {
  if (error) throw error;
}

async function create(record) {
  const { data, error } = await getSupabase().from("buyer_intakes").insert(record).select().single();
  throwIfError(error);
  return data;
}

async function listForUser(userId) {
  const { data, error } = await getSupabase()
    .from("buyer_intakes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  throwIfError(error);
  return data;
}

async function listAll() {
  const { data, error } = await getSupabase()
    .from("buyer_intakes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  throwIfError(error);
  return data;
}

async function countByUserIds(userIds) {
  if (!userIds.length) return {};
  const { data, error } = await getSupabase().from("buyer_intakes").select("user_id").in("user_id", userIds);
  throwIfError(error);
  const counts = {};
  for (const row of data) counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  return counts;
}

async function deleteByUserId(userId) {
  const { error, count } = await getSupabase()
    .from("buyer_intakes")
    .delete({ count: "exact" })
    .eq("user_id", userId);
  throwIfError(error);
  return { deletedCount: count || 0 };
}

module.exports = { create, listForUser, listAll, countByUserIds, deleteByUserId };
