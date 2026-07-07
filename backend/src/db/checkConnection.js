const { getSupabase } = require("./supabaseClient");

async function checkConnection() {
  const supabase = getSupabase();
  const { error } = await supabase.from("users").select("user_id").limit(1);
  if (error) throw error;
}

module.exports = checkConnection;
