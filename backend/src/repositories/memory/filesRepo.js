const store = require("./store");

const TABLE = "files";

async function create(record) {
  return store.insert(TABLE, record);
}

async function findActiveById(fileId) {
  return store.findOne(TABLE, (f) => f.file_id === fileId && !f.is_deleted);
}

async function listByUserId(userId) {
  return store.filterAll(TABLE, (f) => f.user_id === userId);
}

async function countManyByUserIds(userIds) {
  const idSet = new Set(userIds);
  const counts = {};
  for (const row of store.filterAll(TABLE, (f) => idSet.has(f.user_id))) {
    counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  }
  return counts;
}

async function deleteByUserId(userId) {
  return { deletedCount: store.deleteWhere(TABLE, (f) => f.user_id === userId) };
}

module.exports = { create, findActiveById, listByUserId, countManyByUserIds, deleteByUserId };
