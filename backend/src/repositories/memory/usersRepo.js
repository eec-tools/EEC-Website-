const store = require("./store");

const TABLE = "users";

function omitPasswordHash(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return rest;
}

async function create(user) {
  return store.insert(TABLE, user);
}

async function findByEmail(email) {
  return store.findOne(TABLE, (u) => u.email === email);
}

async function findById(userId) {
  return store.findOne(TABLE, (u) => u.user_id === userId);
}

async function findPublicById(userId) {
  return omitPasswordHash(await findById(userId));
}

async function updateById(userId, patch) {
  return store.updateOne(TABLE, (u) => u.user_id === userId, patch);
}

async function updateByEmail(email, patch) {
  return store.updateOne(TABLE, (u) => u.email === email, patch);
}

async function demoteLegacyAdminByEmail(email) {
  const count = store.updateMany(TABLE, (u) => u.email === email && u.role === "admin", { role: "buyer" });
  return count > 0;
}

async function listAll() {
  const rows = store.filterAll(TABLE, () => true).map(omitPasswordHash);
  return store.sortByDesc(rows, "created_at").slice(0, 500);
}

async function deleteById(userId) {
  return { deletedCount: store.deleteWhere(TABLE, (u) => u.user_id === userId) };
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
