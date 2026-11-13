// Single source of truth for company identity and contact details.
// Every page (footer, contact, legal pages, structured data) reads from here.
//
// Values marked "CONFIRM" come from details already published on this site (or are
// commitments the company must be able to keep) and should be double-checked before
// the LinkedIn organization review. If a value is ever unknown, set it to a visible
// "[PLACEHOLDER: ...]" string rather than guessing.

export const COMPANY = {
  // --- Identity ---
  legalName: "Elan Exports Consultancy Pte. Ltd.",
  brandName: "Elan Exports Consultancy",
  shortName: "EEC",
  // Singapore private company limited by shares (the "Pte. Ltd." suffix).
  registrationType: "Private company limited by shares, incorporated in Singapore",
  registrationAuthority: "Accounting and Corporate Regulatory Authority (ACRA), Singapore",
  // Singapore Unique Entity Number. (CIN / LLPIN are Indian registrations and do not apply.)
  registrationNumberLabel: "UEN",
  registrationNumber: "202501728W",
  uen: "202501728W",
  incorporationDateDisplay: "13 January 2025",
  incorporationDateISO: "2025-01-13",
  incorporationMonthYear: "January 2025",
  supplierCountClaim: "70+ verified suppliers",

  // --- Registered office ---
  addressStreet: "36 Jalan Sampurna",
  addressCity: "Singapore",
  addressPostalCode: "268304",
  addressCountry: "SG",
  addressFull: "36 Jalan Sampurna, Singapore 268304",

  // --- Contact ---
  contactEmail: "partners@eectrade.com", // official business email
  // Privacy and data-deletion requests. Same mailbox as the business email until a
  // dedicated address (for example privacy@...) is created. CONFIRM.
  privacyEmail: "partners@eectrade.com",
  // Business telephone / WhatsApp. This is the number already published in the site's
  // WhatsApp button. CONFIRM it is the official business line.
  phone: "+65 8678 4216",
  phoneHref: "tel:+6586784216",
  whatsappUrl: "https://wa.me/6586784216",

  // --- Web presence ---
  websiteUrl: "https://eectrade.com",
  linkedinCompanyUrl: "https://www.linkedin.com/company/elan-exports/",
  socialLinks: [
    "https://www.linkedin.com/company/elan-exports/",
    "https://www.instagram.com/elan_exports_consultancy/",
    "https://www.facebook.com/profile.php?id=61591311811743",
  ],

  // --- Privacy request handling (commitments the company must be able to keep) ---
  // CONFIRM these timeframes with the company before relying on them.
  privacyAcknowledgeBusinessDays: 5,
  privacyCompletionDays: 30,

  // --- Legal page dates ---
  privacyPolicyUpdated: "13 November 2026",
  termsUpdated: "13 November 2026",
  dataDeletionUpdated: "13 November 2026",

  // --- LinkedIn integration (Community Management API) ---
  // What EEC uses, or applies to use, the LinkedIn API for. Rendered in the Privacy Policy.
  // CONFIRM this matches the use case submitted in the LinkedIn developer application.
  linkedin: {
    appPurpose:
      "to manage EEC's own LinkedIn Company Page: publishing and scheduling Page posts, reading and replying to comments on those posts, and viewing Page-level engagement analytics",
  },
};
