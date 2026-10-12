// Launch offers (October 2026). Copy is the approved brief wording, so keep it verbatim.
// Prices are intentionally not shown on the site for now (proposed: USD 195 / USD 295, pending EEC approval).

// Form routes. The forms (Form A / Form B) are built separately; the `service` / `support`
// query values below are what they should read to prefill the selected service.
export const BUYER_REQUEST_PATH = "/buyer-service-request";
export const SUPPLIER_REQUEST_PATH = "/export-readiness-application";

export const buyerRequestHref = (service) => `${BUYER_REQUEST_PATH}?service=${service}`;
export const supplierRequestHref = (support) => `${SUPPLIER_REQUEST_PATH}?support=${support}`;

export const BUYER_OFFERS = [
  {
    id: "background-check",
    title: "Supplier Background Check",
    intro:
      "Before engaging with a new supplier, obtain an independent initial review of publicly available company information and potential risk indicators.",
    provides: [
      "Review of the supplier's stated company identity, location and business details.",
      "Checks of company registration information where accessible through relevant sources.",
      "Review of the supplier's available website and public business presence.",
      "Identification of potential inconsistencies or warning signs.",
      "A concise written findings report with recommendations for further verification.",
    ],
    scope: "One supplier, one country, desk-based research only.",
    delivery: "Target of 3 working days after payment and receipt of complete required information.",
    important:
      "This is an initial information review, not a factory audit, financial audit, legal investigation or guarantee of supplier reliability.",
    facts: ["One supplier", "One country", "Target: 3 working days"],
    useWhen: "You already have a supplier in mind and want an independent check before engaging with them.",
    compare: { scope: "One supplier, one country", delivery: "3 working days (target)" },
    cta: "REQUEST SUPPLIER BACKGROUND CHECK",
    href: buyerRequestHref("background-check"),
  },
  {
    id: "feasibility-snapshot",
    title: "India Sourcing Feasibility Snapshot",
    intro:
      "Considering sourcing a product from India? Understand the market opportunities and potential sourcing challenges before committing significant resources.",
    provides: [
      "Initial assessment of the product's sourcing feasibility in India.",
      "Overview of relevant Indian manufacturing or supply-market characteristics.",
      "Key product specifications and commercial considerations.",
      "Preliminary assessment of common sourcing challenges, including MOQ, quality and certification considerations where information is available.",
      "Recommended next steps for proceeding with sourcing.",
    ],
    scope: "One defined product, one destination country, desk-based research only.",
    delivery: "Target of 5 working days after payment and receipt of complete product requirements.",
    important:
      "This service does not include supplier introductions, confirmed quotations, supplier audits or guaranteed pricing.",
    facts: ["One product", "One destination country", "Target: 5 working days"],
    useWhen: "You are considering sourcing a product from India and want to know if it is feasible before committing resources.",
    compare: { scope: "One product, one destination country", delivery: "5 working days (target)" },
    cta: "REQUEST SOURCING FEASIBILITY SNAPSHOT",
    href: buyerRequestHref("feasibility-snapshot"),
  },
];

export const CUSTOM_SOURCING_OFFER = {
  id: "custom-sourcing",
  title: "Custom Sourcing & Procurement Support",
  intro: "For buyers requiring more comprehensive support, EEC offers:",
  provides: [
    "Supplier identification and preliminary qualification.",
    "Supplier Search and RFQ coordination.",
    "Supplier quotations and commercial comparisons.",
    "Sourcing strategy and procurement advisory.",
    "Ongoing outsourced sourcing assistance.",
  ],
  note: "Assignments are scoped and priced individually according to product requirements, sourcing complexity and the level of support required.",
  useWhen: "You need suppliers identified, quotations compared or ongoing sourcing assistance.",
  compare: { scope: "Scoped to your requirements", delivery: "Agreed in your proposal" },
  cta: "REQUEST A CUSTOM SOURCING PROPOSAL",
  href: buyerRequestHref("custom-sourcing"),
};

export const SERVICE_TERMS = [
  {
    title: "Scope of Services",
    body: "Each published fixed-fee service covers only the activities and deliverables described in the selected service. Additional research, verification, supplier introductions or advisory work requires a separate agreement.",
  },
  {
    title: "Payment",
    body: "Fixed-fee Buyer Services require full advance payment following EEC's confirmation of the assignment and issuance of payment instructions.",
  },
  {
    title: "Commencement and Delivery",
    body: "Delivery timelines begin once EEC has accepted the assignment, received payment and obtained all necessary information. If essential information is missing, EEC will request clarification before commencing work.",
  },
  {
    title: "Research and Information",
    body: "EEC uses available information and relevant research sources. Findings are based on information accessible at the time of assessment. Third-party information may be incomplete or subject to change.",
  },
  {
    title: "Limitations",
    body: "EEC does not guarantee supplier performance, product quality, regulatory approval, particular commercial outcomes, purchasing orders or export success.",
  },
  {
    title: "Cancellation and Refunds",
    body: "If EEC cannot accept or deliver the agreed assignment, any amount paid will be refunded. For other cancellation or refund requests, the applicable terms will be confirmed before payment.",
  },
  {
    title: "Confidentiality and Data",
    body: "Information provided by customers will be used to review enquiries and deliver agreed services. EEC may use appropriate technology and research tools while applying reasonable safeguards to business information.",
  },
  {
    title: "Additional Services",
    body: "Any work outside the agreed service scope will be quoted separately and undertaken only with customer approval.",
  },
];

export const SUPPLIER_ASSESSMENT_AREAS = [
  "Company and export fundamentals.",
  "Product and commercial readiness.",
  "Export documentation and compliance readiness.",
  "Buyer-facing presentation and responsiveness.",
  "RFQ handling and operational readiness.",
  "International market and buyer readiness.",
];

export const SUPPLIER_DELIVERABLES = [
  "An EEC Export Readiness Score.",
  "Assessment across key readiness categories.",
  "Identification of important gaps and potential risks.",
  "Priority improvement recommendations.",
  "A practical 90-day improvement action plan.",
];

export const SUPPLIER_PILOT_TERMS = [
  "Open to manufacturers and exporters, subject to EEC's eligibility assessment.",
  "Limited to 10 accepted companies.",
  "Each assessment covers one company and one principal product category.",
  "Applicants must complete EEC's questionnaire and provide sufficient supporting information.",
  "The diagnostic is a desk-based assessment, not a factory audit, certification or legal compliance approval.",
  "Participation does not guarantee export orders or buyer introductions.",
  "EEC may offer additional paid services following the assessment. There is no obligation to purchase.",
];

export const SUPPLIER_DIAGNOSTIC_CTA = {
  label: "APPLY FOR COMPLIMENTARY DIAGNOSTIC",
  href: supplierRequestHref("complimentary-diagnostic"),
};

export const SUPPLIER_PAID_CTA = {
  label: "REQUEST PAID EXPORT SUPPORT",
  href: supplierRequestHref("paid-export-support"),
};

// Form A / Form B options. Keep the ids in sync with backend/src/data/serviceRequests.js.
export const PURCHASING_TIMELINES = [
  "Within 30 days",
  "1 to 3 months",
  "3 to 6 months",
  "6 to 12 months",
  "Not decided yet",
];

export const SUPPLIER_SUPPORT_OPTIONS = [
  {
    value: "complimentary-diagnostic",
    label: "Complimentary Diagnostic Pilot",
    sub: "Limited to 10 accepted companies, subject to eligibility review",
  },
  {
    value: "paid-export-support",
    label: "Paid Export Support",
    sub: "Proposed according to your business and requirements",
  },
];

export const SUPPLIER_BUSINESS_TYPES = ["Manufacturer", "Exporter", "Trader", "Manufacturer and exporter"];
