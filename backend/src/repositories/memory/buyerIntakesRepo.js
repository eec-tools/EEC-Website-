const store = require("./store");

const TABLE = "buyerIntakes";

async function create(record) {
  return store.insert(TABLE, record);
}

async function listForUser(userId) {
  const rows = store.filterAll(TABLE, (r) => r.user_id === userId);
  return store.sortByDesc(rows, "created_at").slice(0, 200);
}

async function listAll() {
  const rows = store.filterAll(TABLE, () => true);
  return store.sortByDesc(rows, "created_at").slice(0, 200);
}

async function countByUserIds(userIds) {
  const idSet = new Set(userIds);
  const counts = {};
  for (const row of store.filterAll(TABLE, (r) => idSet.has(r.user_id))) {
    counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  }
  return counts;
}

async function deleteByUserId(userId) {
  return { deletedCount: store.deleteWhere(TABLE, (r) => r.user_id === userId) };
}

module.exports = { create, listForUser, listAll, countByUserIds, deleteByUserId };
