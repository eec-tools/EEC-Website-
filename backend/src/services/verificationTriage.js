// Quick triage of a buyer or supplier enquiry so EEC knows how much to trust it before replying.
// This is NOT verification: the registry check happens before a paid assignment is accepted.

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "ymail.com",
  "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com", "icloud.com", "me.com",
  "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com", "zoho.com",
  "rediffmail.com", "qq.com", "163.com",
]);

function emailDomain(email) {
  return String(email || "").split("@").pop().trim().toLowerCase();
}

function websiteHost(website) {
  try {
    const raw = String(website || "").trim();
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function domainsMatch(a, b) {
  return !!a && !!b && (a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`));
}

// Returns { level, notes, label }.
//   Number provided : the buyer gave a registration number and country
//   Needs help      : no number, but a business email domain plus website/LinkedIn to check
//   Low confidence  : no number and a free email address
function triageRequest(data) {
  const domain = emailDomain(data.business_email);
  const free = FREE_EMAIL_DOMAINS.has(domain);
  const notes = [];
  if (free) notes.push("free email domain");
  else if (!domainsMatch(domain, websiteHost(data.company_website))) notes.push("email domain does not match website");

  let level;
  if (data.registration_status === "provided") level = "Number provided";
  else if (!free) level = "Needs help";
  else level = "Low confidence";

  return { level, notes, label: notes.length ? `${level} (${notes.join("; ")})` : level };
}

module.exports = { triageRequest, FREE_EMAIL_DOMAINS };
