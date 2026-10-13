const test = require("node:test");
const assert = require("node:assert");
const { triageRequest } = require("../src/services/verificationTriage");
const { buyerServiceRequestSchema } = require("../src/validation/schemas");

const base = {
  full_name: "A B", company_name: "Acme Ltd", company_website: "www.acme.com", country: "UK",
  business_email: "a@acme.com", contact_number: "+44 1", service: "custom-sourcing",
  product_category: "Tiles", order_quantity: "2 containers", purchasing_timeline: "1-3 months",
  consent_accuracy_privacy: "true", consent_service_terms: "true",
};

test("triage levels", () => {
  assert.equal(triageRequest({ ...base, registration_status: "provided" }).label, "Number provided");
  assert.equal(triageRequest({ ...base, registration_status: "not-available" }).level, "Needs help");
  const low = triageRequest({ ...base, registration_status: "not-available", business_email: "a@gmail.com" });
  assert.equal(low.level, "Low confidence");
  assert.match(low.label, /free email domain/);
  assert.match(
    triageRequest({ ...base, registration_status: "provided", business_email: "a@other.com" }).label,
    /does not match website/
  );
});

test("schema requires number or LinkedIn", () => {
  assert.equal(buyerServiceRequestSchema.safeParse({ ...base }).success, false);
  assert.equal(buyerServiceRequestSchema.safeParse({ ...base, registration_status: "provided" }).success, false);
  assert.ok(buyerServiceRequestSchema.safeParse({ ...base, registration_status: "provided", registration_number: "123", registration_country: "UK" }).success);
  assert.equal(buyerServiceRequestSchema.safeParse({ ...base, registration_status: "not-available" }).success, false);
  assert.ok(buyerServiceRequestSchema.safeParse({ ...base, registration_status: "not-available", company_linkedin: "linkedin.com/company/acme" }).success);
});

test("supplier schema requires website and number or LinkedIn", () => {
  const { supplierExportApplicationSchema: schema } = require("../src/validation/schemas");
  const sup = {
    full_name: "A B", company_name: "Acme Exports", country: "India", company_website: "www.acme.in",
    business_email: "a@acme.in", contact_number: "+91 1", business_type: "Manufacturer", main_product: "Tiles",
    currently_exporting: "No", target_export_countries: "UK", main_export_challenges: "x", support_sought: "y",
    support_type: "paid-export-support", consent_eligibility_privacy: "true",
    registration_status: "provided", registration_number: "27AAAAA0000A1Z5", registration_country: "India",
  };
  assert.ok(schema.safeParse(sup).success);
  assert.equal(schema.safeParse({ ...sup, company_website: "" }).success, false);
  assert.equal(schema.safeParse({ ...sup, registration_status: "not-available" }).success, false);
  assert.ok(schema.safeParse({ ...sup, registration_status: "not-available", company_linkedin: "linkedin.com/company/acme" }).success);
});
