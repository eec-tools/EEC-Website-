const { getSupabase } = require("../../db/supabaseClient");

function throwIfError(error) {
  if (error) throw error;
}

async function create(record) {
  const { data, error } = await getSupabase().from("files").insert(record).select().single();
  throwIfError(error);
  return data;
}

async function findActiveById(fileId) {
  const { data, error } = await getSupabase()
    .from("files")
    .select("*")
    .eq("file_id", fileId)
    .eq("is_deleted", false)
    .maybeSingle();
  throwIfError(error);
  return data;
}

async function listByUserId(userId) {
  const { data, error } = await getSupabase().from("files").select("*").eq("user_id", userId);
  throwIfError(error);
  return data;
}

async function countManyByUserIds(userIds) {
  if (!userIds.length) return {};
  const { data, error } = await getSupabase().from("files").select("user_id").in("user_id", userIds);
  throwIfError(error);
  const counts = {};
  for (const row of data) counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  return counts;
}

async function deleteByUserId(userId) {
  const { error, count } = await getSupabase()
    .from("files")
    .delete({ count: "exact" })
    .eq("user_id", userId);
  throwIfError(error);
  return { deletedCount: count || 0 };
}

module.exports = { create, findActiveById, listByUserId, countManyByUserIds, deleteByUserId };
