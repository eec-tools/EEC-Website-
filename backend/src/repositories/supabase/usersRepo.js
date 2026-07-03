const { getSupabase } = require("../../db/supabaseClient");

const PUBLIC_COLUMNS =
  "user_id, email, name, role, company, picture, auth_provider, created_at";

function throwIfError(error) {
  if (error) throw error;
}

async function create(user) {
  const { data, error } = await getSupabase().from("users").insert(user).select().single();
  throwIfError(error);
  return data;
}

async function findByEmail(email) {
  const { data, error } = await getSupabase().from("users").select("*").eq("email", email).maybeSingle();
  throwIfError(error);
  return data;
}

async function findById(userId) {
  const { data, error } = await getSupabase().from("users").select("*").eq("user_id", userId).maybeSingle();
  throwIfError(error);
  return data;
}

async function findPublicById(userId) {
  const { data, error } = await getSupabase()
    .from("users")
    .select(PUBLIC_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(error);
  return data;
}

async function updateById(userId, patch) {
  const { data, error } = await getSupabase()
    .from("users")
    .update(patch)
    .eq("user_id", userId)
    .select()
    .single();
  throwIfError(error);
  return data;
}

async function updateByEmail(email, patch) {
  const { data, error } = await getSupabase()
    .from("users")
    .update(patch)
    .eq("email", email)
    .select()
    .single();
  throwIfError(error);
  return data;
}

async function demoteLegacyAdminByEmail(email) {
  const { data, error } = await getSupabase()
    .from("users")
    .update({ role: "buyer" })
    .eq("email", email)
    .eq("role", "admin")
    .select("user_id");
  throwIfError(error);
  return Boolean(data && data.length > 0);
}

async function listAll() {
  const { data, error } = await getSupabase()
    .from("users")
    .select(PUBLIC_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);
  throwIfError(error);
  return data;
}

async function deleteById(userId) {
  const { error, count } = await getSupabase()
    .from("users")
    .delete({ count: "exact" })
    .eq("user_id", userId);
  throwIfError(error);
  return { deletedCount: count || 0 };
}

module.exports = {
  create,
  findByEmail,
  findById,
  findPublicById,
  updateById,
  updateByEmail,
  demoteLegacyAdminByEmail,
  listAll,
  deleteById,
};
