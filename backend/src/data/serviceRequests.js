// Options and field labels for the two public enquiry forms (October 2026 launch brief).
// Form A: Buyer Service Request. Form B: Supplier Export Readiness Application.
// The ids match the `?service=` / `?support=` values used by the service buttons.

const BUYER_SERVICES = {
  "background-check": "Supplier Background Check",
  "feasibility-snapshot": "India Sourcing Feasibility Snapshot",
  "custom-sourcing": "Custom Sourcing & Procurement Support",
};

const SUPPLIER_SUPPORT_TYPES = {
  "complimentary-diagnostic": "Complimentary Diagnostic Pilot",
  "paid-export-support": "Paid Export Support",
};

// How the buyer answered the company registration question. Verification itself happens
// before a paid assignment is accepted, not at enquiry time.
const REGISTRATION_STATUSES = {
  provided: "Registration number provided",
  "not-available": "Not available / need help",
};

const BUSINESS_TYPES = ["Manufacturer", "Exporter", "Trader", "Manufacturer and exporter"];

// Order matters: this is the order fields appear in the EEC email.
const BUYER_FIELD_LABELS = {
  service: "Requested service",
  full_name: "Full name",
  company_name: "Company name",
  company_website: "Company website",
  country: "Country",
  registration_status: "Company registration",
  registration_number: "Registration number",
  registration_country: "Country of registration",
  company_linkedin: "Company LinkedIn page",
  business_email: "Business email",
  contact_number: "Contact number",
  product_category: "Product / product category",
  supplier_name: "Supplier name",
  supplier_website: "Supplier website",
  supplier_country: "Supplier country",
  product_specifications: "Product specifications",
  destination_country: "Intended destination country",
  order_quantity: "Estimated order quantity",
  purchasing_timeline: "Expected purchasing timeline",
  additional_information: "Additional information",
};

const SUPPLIER_FIELD_LABELS = {
  support_type: "Requested support",
  full_name: "Full name",
  company_name: "Company name",
  country: "Country",
  company_website: "Company website",
  business_email: "Business email",
  contact_number: "Contact number",
  business_type: "Manufacturer, exporter or trader",
  main_product: "Main product / product category",
  currently_exporting: "Currently exporting",
  current_export_countries: "Current export countries",
  target_export_countries: "Target export countries",
  main_export_challenges: "Main export challenges",
  support_sought: "Support sought",
};

module.exports = {
  BUYER_SERVICES,
  SUPPLIER_SUPPORT_TYPES,
  REGISTRATION_STATUSES,
  BUSINESS_TYPES,
  BUYER_FIELD_LABELS,
  SUPPLIER_FIELD_LABELS,
};
