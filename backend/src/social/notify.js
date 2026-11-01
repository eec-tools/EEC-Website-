// Emails from the social engine. Recipients come from settings and members only,
// never from post content or from the writing agent.
const config = require("../config/env");
const emailService = require("../services/emailService");
const { getStore } = require("./store");
const { localParts } = require("./time");

const CHANNEL_NAMES = {
  linkedin_shirali: "LinkedIn (Shirali)",
  linkedin_company: "LinkedIn (EEC page)",
  instagram: "Instagram",
  facebook: "Facebook",
};

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function studioUrl(path = "") {
  return `${(config.frontendUrl || "https://www.eectrade.com").replace(/\/$/, "")}/studio${path}`;
}

function whenLocal(iso, tz) {
  const lp = localParts(new Date(iso), tz);
  const day = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }[lp.weekday];
  return `${day} ${lp.date} ${lp.time}`;
}

function wrap(title, inner) {
  return `<div style="font-family:Arial,sans-serif;max-width:640px;color:#0D1B40">
<h2 style="margin:0 0 12px">${esc(title)}</h2>${inner}
<p style="margin-top:24px;font-size:12px;color:#5b6475">EEC Social Studio. Open <a href="${studioUrl()}">${studioUrl()}</a></p></div>`;
}

function postTable(posts, tz) {
  const rows = posts
    .map(
      (p) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee">${esc(whenLocal(p.slot_at, tz))}</td><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee">${esc(CHANNEL_NAMES[p.channel] || p.channel)}</td><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee">${esc(p.topic)}</td><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee">${esc(p.status)}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;font-size:14px"><tr><th align="left" style="padding:6px 10px">When (IST)</th><th align="left" style="padding:6px 10px">Channel</th><th align="left" style="padding:6px 10px">Topic</th><th align="left" style="padding:6px 10px">Status</th></tr>${rows}</table>`;
}

async function approverEmails() {
  const members = await getStore().list("social_members", { where: { role: "approver", active: true } });
  return members.map((m) => m.email);
}

async function send(to, subject, html) {
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!list.length) return false;
  return emailService.sendMail({ to: list.join(", "), subject, html });
}

module.exports = { send, wrap, postTable, approverEmails, studioUrl, whenLocal, esc, CHANNEL_NAMES };
