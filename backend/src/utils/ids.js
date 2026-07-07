const { randomUUID } = require("crypto");

function shortHex(len) {
  return randomUUID().replace(/-/g, "").slice(0, len);
}

module.exports = {
  genUserId: () => `user_${shortHex(12)}`,
  genFileId: () => randomUUID(),
  genIntakeId: () => `intake_${shortHex(12)}`,
  genApplicationId: () => `app_${shortHex(12)}`,
  genLeadId: () => `lead_${shortHex(12)}`,
  genNewsletterSubscriberId: () => `newsletter_${shortHex(12)}`,
  genToken: () => randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, ""),
  genNonce: () => randomUUID().replace(/-/g, ""),
};
