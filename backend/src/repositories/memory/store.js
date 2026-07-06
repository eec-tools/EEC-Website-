const tables = {
  users: [],
  files: [],
  buyerIntakes: [],
  supplierApplications: [],
  leads: [],
  newsletterSubscribers: [],
  passwordResetTokens: [],
};

function insert(table, row) {
  const copy = { ...row };
  tables[table].push(copy);
  return { ...copy };
}

function findOne(table, predicate) {
  const row = tables[table].find(predicate);
  return row ? { ...row } : null;
}

function filterAll(table, predicate) {
  return tables[table].filter(predicate).map((row) => ({ ...row }));
}

function updateOne(table, predicate, patch) {
  const row = tables[table].find(predicate);
  if (!row) return null;
  Object.assign(row, patch);
  return { ...row };
}

function updateMany(table, predicate, patch) {
  let count = 0;
  for (const row of tables[table]) {
    if (predicate(row)) {
      Object.assign(row, patch);
      count += 1;
    }
  }
  return count;
}

function deleteWhere(table, predicate) {
  const before = tables[table].length;
  tables[table] = tables[table].filter((row) => !predicate(row));
  return before - tables[table].length;
}

function sortByDesc(rows, key) {
  return [...rows].sort((a, b) => (a[key] < b[key] ? 1 : a[key] > b[key] ? -1 : 0));
}

module.exports = { insert, findOne, filterAll, updateOne, updateMany, deleteWhere, sortByDesc };
