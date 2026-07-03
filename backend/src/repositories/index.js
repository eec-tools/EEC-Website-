const memoryImpls = {
  users: require("./memory/usersRepo"),
  files: require("./memory/filesRepo"),
  buyerIntakes: require("./memory/buyerIntakesRepo"),
  supplierApplications: require("./memory/supplierApplicationsRepo"),
  leads: require("./memory/leadsRepo"),
  passwordResetTokens: require("./memory/passwordResetTokensRepo"),
};

const supabaseImpls = {
  users: require("./supabase/usersRepo"),
  files: require("./supabase/filesRepo"),
  buyerIntakes: require("./supabase/buyerIntakesRepo"),
  supplierApplications: require("./supabase/supplierApplicationsRepo"),
  leads: require("./supabase/leadsRepo"),
  passwordResetTokens: require("./supabase/passwordResetTokensRepo"),
};

let mode = null; // 'memory' | 'postgres' — set once by bootstrap() before app.listen()

function setMode(m) {
  mode = m;
}

function getMode() {
  return mode;
}

function impls() {
  return mode === "postgres" ? supabaseImpls : memoryImpls;
}

function proxy(table) {
  return new Proxy(
    {},
    {
      get(_target, fn) {
        return (...args) => impls()[table][fn](...args);
      },
    }
  );
}

module.exports = {
  setMode,
  getMode,
  users: proxy("users"),
  files: proxy("files"),
  buyerIntakes: proxy("buyerIntakes"),
  supplierApplications: proxy("supplierApplications"),
  leads: proxy("leads"),
  passwordResetTokens: proxy("passwordResetTokens"),
};
