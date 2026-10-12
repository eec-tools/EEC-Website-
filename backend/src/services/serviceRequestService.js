// Handles a submitted enquiry form: emails the customer, notifies EEC and logs a row
// in the "EEC Website Service Requests" Google Sheet (through an n8n webhook).
const { randomInt } = require("crypto");
const axios = require("axios");
const config = require("../config/env");
const logger = require("../utils/logger");
const { sendMail } = require("./emailService");
const {
  BUYER_SERVICES,
  SUPPLIER_SUPPORT_TYPES,
  BUYER_FIELD_LABELS,
  SUPPLIER_FIELD_LABELS,
} = require("../data/serviceRequests");

const SITE_URL = "https://eectrade.com";

const FORMS = {
  buyer: {
    code: "BSR",
    formName: "Buyer Service Request",
    sheetTab: "Buyer Service Requests",
    labels: BUYER_FIELD_LABELS,
    serviceKey: "service",
    serviceNames: BUYER_SERVICES,
  },
  supplier: {
    code: "ERA",
    formName: "Supplier Export Readiness Application",
    sheetTab: "Export Readiness Applications",
    labels: SUPPLIER_FIELD_LABELS,
    serviceKey: "support_type",
    serviceNames: SUPPLIER_SUPPORT_TYPES,
  },
};

function makeReference(code, date) {
  const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, "");
  return `EEC-${code}-${yymmdd}-${String(randomInt(0, 10000)).padStart(4, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// [label, value] pairs for every answered field, in form order, with readable service names.
function answeredFields(form, data) {
  return Object.entries(form.labels)
    .map(([key, label]) => {
      let value = data[key];
      if (key === form.serviceKey) value = form.serviceNames[value] || value;
      return [label, value];
    })
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");
}

function fieldsAsText(rows) {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function fieldsAsHtml(rows) {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;color:#012D76;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;font-size:14px">${body}</table>`;
}

function wrapHtml(inner) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#3A4759;max-width:640px">${inner}</div>`;
}

function customerEmail(kind, data, reference, rows) {
  const name = escapeHtml(data.full_name);
  const signOff =
    "Kind regards,\nElan Exports Consultancy (EEC)\npartners@eectrade.com\n" + SITE_URL;
  const signOffHtml = signOff.split("\n").map(escapeHtml).join("<br>");

  if (kind === "buyer") {
    const service = BUYER_SERVICES[data.service];
    const paymentLine =
      data.service === "custom-sourcing"
        ? "Custom assignments are scoped and priced individually. We will send you a proposal before any work begins."
        : "No payment is due now. If EEC accepts the assignment, we will confirm it and send payment instructions. Work begins after payment and receipt of all required information.";
    const paragraphs = [
      `Thank you for your request for EEC's ${service}. We have received it and our team will review it and contact you with the next steps.`,
      paymentLine,
      `Your reference is ${reference}. Please quote it in any reply.`,
    ];
    return {
      subject: `We have received your EEC service request (${reference})`,
      text: `Dear ${data.full_name},\n\n${paragraphs.join("\n\n")}\n\nWhat you submitted:\n${fieldsAsText(rows)}\n\n${signOff}`,
      html: wrapHtml(
        `<p>Dear ${name},</p>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}` +
          `<p style="margin-top:20px;color:#012D76;font-weight:bold">What you submitted</p>${fieldsAsHtml(rows)}` +
          `<p style="margin-top:20px">${signOffHtml}</p>`
      ),
    };
  }

  const support = SUPPLIER_SUPPORT_TYPES[data.support_type];
  const paragraphs = [
    `Thank you for applying for EEC Export Readiness Support (${support}). We have received your application and our team will review it and contact you with the next steps.`,
    data.support_type === "complimentary-diagnostic"
      ? "The complimentary pilot is limited to 10 accepted companies and is subject to EEC's eligibility review. Submitting an application does not guarantee acceptance."
      : "Paid export support is proposed according to your business, product, destination market and requirements. We will send you a proposal before any work begins.",
    `Your reference is ${reference}. Please quote it in any reply.`,
  ];
  return {
    subject: `We have received your EEC export readiness application (${reference})`,
    text: `Dear ${data.full_name},\n\n${paragraphs.join("\n\n")}\n\nWhat you submitted:\n${fieldsAsText(rows)}\n\n${signOff}`,
    html: wrapHtml(
      `<p>Dear ${name},</p>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}` +
        `<p style="margin-top:20px;color:#012D76;font-weight:bold">What you submitted</p>${fieldsAsHtml(rows)}` +
        `<p style="margin-top:20px">${signOffHtml}</p>`
    ),
  };
}

function eecEmail(form, data, reference, rows, submittedAt, files) {
  const service = form.serviceNames[data[form.serviceKey]];
  const fileNote = files.length
    ? `Supporting documents attached: ${files.map((f) => f.originalname).join(", ")}`
    : "No supporting documents uploaded.";
  const intro = `New ${form.formName} from the EEC website.\nReference: ${reference}\nSubmitted: ${submittedAt}\nReply to this email to respond to the customer directly.`;
  return {
    subject: `New ${form.formName} from ${data.company_name}: ${service} (${reference})`,
    text: `${intro}\n\n${fieldsAsText(rows)}\n\n${fileNote}`,
    html: wrapHtml(
      `<p>${intro.split("\n").map(escapeHtml).join("<br>")}</p>${fieldsAsHtml(rows)}<p>${escapeHtml(fileNote)}</p>`
    ),
    attachments: files.map((f) => ({ filename: f.originalname, content: f.buffer, contentType: f.mimetype })),
  };
}

async function logToSheet(form, data, reference, submittedAt, files) {
  const url = config.serviceRequestSheetWebhookUrl;
  if (!url) {
    logger.warning(`Sheet logging skipped for ${reference}: no webhook URL configured`);
    return false;
  }
  const row = {
    sheet_tab: form.sheetTab,
    Date: submittedAt,
    Reference: reference,
    Status: "New",
  };
  for (const [key, label] of Object.entries(form.labels)) {
    let value = data[key] ?? "";
    if (key === form.serviceKey) value = form.serviceNames[value] || value;
    row[label] = value;
  }
  if (form === FORMS.buyer) {
    row["Supporting documents"] = files.map((f) => f.originalname).join(", ");
  }
  try {
    await axios.post(url, row, { timeout: 15000 });
    return true;
  } catch (e) {
    logger.error(`Sheet logging failed for ${reference}: ${e.message}`);
    return false;
  }
}

// Returns { reference, notified, logged, confirmationSent }.
async function handleSubmission(kind, data, files = []) {
  const form = FORMS[kind];
  const now = new Date();
  const reference = makeReference(form.code, now);
  // Readable date in IST for the sheet and the EEC email, e.g. "12 Oct 2026, 14:05 IST".
  const submittedAt =
    now.toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " IST";
  const rows = answeredFields(form, data);

  const eec = eecEmail(form, data, reference, rows, submittedAt, files);
  const customer = customerEmail(kind, data, reference, rows);

  // Await everything before responding: on Vercel the function is frozen once the response is sent.
  const [notified, confirmationSent, logged] = await Promise.all([
    sendMail({ to: config.serviceRequestNotifyEmail, replyTo: data.business_email, ...eec }),
    sendMail({ to: data.business_email, replyTo: config.serviceRequestNotifyEmail, ...customer }),
    logToSheet(form, data, reference, submittedAt, files),
  ]);

  logger.info(
    `${form.formName} ${reference}: eec_email=${notified} customer_email=${confirmationSent} sheet=${logged}`
  );
  return { reference, notified, logged, confirmationSent };
}

module.exports = { handleSubmission, makeReference };
