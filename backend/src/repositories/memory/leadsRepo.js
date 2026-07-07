const store = require("./store");

async function create(record) {
  return store.insert("leads", record);
}

module.exports = { create };
