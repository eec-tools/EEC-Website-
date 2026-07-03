const store = require("./store");

const TABLE = "passwordResetTokens";

async function create(record) {
  return store.insert(TABLE, record);
}

async function findValidByToken(token) {
  return store.findOne(TABLE, (t) => t.token === token && !t.used);
}

async function markUsed(token) {
  return store.updateOne(TABLE, (t) => t.token === token, { used: true });
}

module.exports = { create, findValidByToken, markUsed };
