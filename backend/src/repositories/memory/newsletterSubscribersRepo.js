const store = require("./store");

const TABLE = "newsletterSubscribers";

async function upsertByEmail(record) {
  const existing = store.findOne(TABLE, (r) => r.email === record.email);
  if (existing) {
    return store.updateOne(TABLE, (r) => r.email === record.email, {
      source_page: record.source_page,
      submitted_at: record.submitted_at,
    });
  }
  return store.insert(TABLE, record);
}

async function listAll() {
  return store.sortByDesc(store.filterAll(TABLE, () => true), "submitted_at");
}

module.exports = { upsertByEmail, listAll };
