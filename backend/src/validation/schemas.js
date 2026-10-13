const { z } = require("zod");
const SOURCING_CATEGORIES = require("../data/sourcingCategories");
const {
  BUYER_SERVICES,
  REGISTRATION_STATUSES,
  SUPPLIER_SUPPORT_TYPES,
  BUSINESS_TYPES,
} = require("../data/serviceRequests");

const email = z.string().email();

const registerSchema = z.object({
  email,
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["buyer", "supplier"]).default("buyer"),
  company: z.string().nullable().optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

const passwordResetRequestSchema = z.object({
  email,
});

const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const buyerIntakeSchema = z.object({
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
  contact_email: email,
  contact_phone: z.string().nullable().optional(),
  country: z.string().min(1),
  product_category: z
    .string()
    .refine((v) => SOURCING_CATEGORIES.includes(v) || v === "Other", {
      message: `product_category must be one of: ${SOURCING_CATEGORIES.join(", ")}, Other`,
    }),
  product_specs: z.string().min(1),
  annual_volume: z.string().min(1),
  target_price: z.string().nullable().optional(),
  timeline: z.string().min(1),
  pain_points: z.string().nullable().optional(),
  additional_notes: z.string().nullable().optional(),
});

const supplierApplicationSchema = z.object({
  company_name: z.string().min(1),
  headquarters_address: z.string().nullable().optional(),
  year_established: z.string().nullable().optional(),
  contact_name: z.string().min(1),
  contact_position: z.string().nullable().optional(),
  contact_email: email,
  contact_phone: z.string().min(1),
  additional_contact_name: z.string().nullable().optional(),
  additional_contact_position: z.string().nullable().optional(),
  additional_contact_email: z.string().nullable().optional(),
  additional_contact_phone: z.string().nullable().optional(),
  country: z.string().min(1),
  state: z.string().nullable().optional(),
  iec_number: z.string().nullable().optional(),
  gst_number: z.string().nullable().optional(),
  company_overview: z.string().nullable().optional(),
  annual_revenue: z.string().nullable().optional(),
  key_markets: z.string().nullable().optional(),
  notable_clients: z.string().nullable().optional(),
  case_studies: z.string().nullable().optional(),
  languages_spoken: z.string().nullable().optional(),
  preferred_communication: z.string().nullable().optional(),
  special_capabilities: z.string().nullable().optional(),
  product_categories: z
    .array(z.string())
    .min(1)
    .refine((arr) => arr.every((c) => SOURCING_CATEGORIES.includes(c)), {
      message: `product_categories must all be one of: ${SOURCING_CATEGORIES.join(", ")}`,
    }),
  product_description: z.string().nullable().optional(),
  annual_capacity: z.string().min(1),
  export_experience: z.string().min(1),
  certifications: z.array(z.string()).default([]),
  factory_size: z.string().nullable().optional(),
  factory_locations: z.string().nullable().optional(),
  employee_count: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  documents: z.array(z.record(z.any())).default([]),
  notes: z.string().nullable().optional(),
});

const contactLeadSchema = z.object({
  name: z.string().min(1),
  email,
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  message: z.string().min(1),
  source: z.string().default("contact"),
});

const newsletterSubscribeSchema = z.object({
  email,
  source_page: z.string().nullable().optional(),
});

// ---- Public enquiry forms (Form A / Form B) ----
// Form A arrives as multipart/form-data, so every value is a string.

const text = (label, max = 300) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z
      .string({ required_error: `${label} is required.`, invalid_type_error: `${label} is required.` })
      .min(1, `${label} is required.`)
      .max(max, `${label} is too long.`)
  );

const optionalText = (label, max = 300) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v ?? ""),
    z.string().max(max, `${label} is too long.`)
  );

const formEmail = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z
    .string({ required_error: "Business email is required." })
    .email("Enter a valid business email address.")
    .max(254, "Business email is too long.")
);

const mustAgree = (message) =>
  z.preprocess((v) => v === true || v === "true" || v === "on", z.literal(true, { errorMap: () => ({ message }) }));

const requireWhen = (ctx, data, fields) => {
  for (const [key, label] of fields) {
    if (!data[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${label} is required.` });
  }
};

const buyerServiceRequestSchema = z
  .object({
    full_name: text("Full name", 120),
    company_name: text("Company name", 200),
    company_website: text("Company website", 300),
    country: text("Country", 100),
    registration_status: z.enum(Object.keys(REGISTRATION_STATUSES), {
      errorMap: () => ({ message: "Tell us whether you have a company registration number." }),
    }),
    registration_number: optionalText("Registration number", 100),
    registration_country: optionalText("Country of registration", 100),
    company_linkedin: optionalText("Company LinkedIn page", 300),
    business_email: formEmail,
    contact_number: text("Contact number", 40),
    service: z.enum(Object.keys(BUYER_SERVICES), {
      errorMap: () => ({ message: "Select a service." }),
    }),
    product_category: text("Product / product category", 300),
    supplier_name: optionalText("Supplier name", 200),
    supplier_website: optionalText("Supplier website", 300),
    supplier_country: optionalText("Supplier country", 100),
    product_specifications: optionalText("Product specifications", 4000),
    destination_country: optionalText("Intended destination country", 100),
    order_quantity: optionalText("Estimated order quantity", 200),
    purchasing_timeline: optionalText("Expected purchasing timeline", 200),
    additional_information: optionalText("Additional information", 4000),
    consent_accuracy_privacy: mustAgree("Please confirm the accuracy and privacy statement."),
    consent_service_terms: mustAgree("Please agree to the Service Terms."),
  })
  .superRefine((data, ctx) => {
    if (data.registration_status === "provided") {
      requireWhen(ctx, data, [
        ["registration_number", "Registration number"],
        ["registration_country", "Country of registration"],
      ]);
    } else {
      // No number yet: a LinkedIn company page is the alternative signal EEC triages on.
      requireWhen(ctx, data, [["company_linkedin", "Company LinkedIn page"]]);
    }
    if (data.service === "background-check") {
      requireWhen(ctx, data, [
        ["supplier_name", "Supplier name"],
        ["supplier_website", "Supplier website"],
        ["supplier_country", "Supplier country"],
      ]);
    }
    if (data.service === "feasibility-snapshot") {
      requireWhen(ctx, data, [
        ["product_specifications", "Product specifications"],
        ["destination_country", "Intended destination country"],
      ]);
    }
    // "For sourcing enquiries" in the brief: Feasibility Snapshot and Custom Sourcing.
    if (data.service === "feasibility-snapshot" || data.service === "custom-sourcing") {
      requireWhen(ctx, data, [
        ["order_quantity", "Estimated order quantity"],
        ["purchasing_timeline", "Expected purchasing timeline"],
      ]);
    }
  });

const supplierExportApplicationSchema = z
  .object({
    full_name: text("Full name", 120),
    company_name: text("Company name", 200),
    country: text("Country", 100),
    company_website: text("Company website", 300),
    registration_status: z.enum(Object.keys(REGISTRATION_STATUSES), {
      errorMap: () => ({ message: "Tell us whether you have a company registration number." }),
    }),
    registration_number: optionalText("Registration number", 100),
    registration_country: optionalText("Country of registration", 100),
    company_linkedin: optionalText("Company LinkedIn page", 300),
    business_email: formEmail,
    contact_number: text("Contact number", 40),
    business_type: z.enum(BUSINESS_TYPES, {
      errorMap: () => ({ message: "Select whether you are a manufacturer, exporter or trader." }),
    }),
    main_product: text("Main product / product category", 300),
    currently_exporting: z.enum(["Yes", "No"], {
      errorMap: () => ({ message: "Tell us whether you are currently exporting." }),
    }),
    current_export_countries: optionalText("Current export countries", 500),
    target_export_countries: text("Target export countries", 500),
    main_export_challenges: text("Main export challenges", 4000),
    support_sought: text("What support you are seeking", 4000),
    support_type: z.enum(Object.keys(SUPPLIER_SUPPORT_TYPES), {
      errorMap: () => ({ message: "Select the Complimentary Diagnostic Pilot or Paid Export Support." }),
    }),
    consent_eligibility_privacy: mustAgree("Please confirm the eligibility and privacy statement."),
  })
  .superRefine((data, ctx) => {
    if (data.registration_status === "provided") {
      requireWhen(ctx, data, [
        ["registration_number", "Registration number"],
        ["registration_country", "Country of registration"],
      ]);
    } else {
      requireWhen(ctx, data, [["company_linkedin", "Company LinkedIn page"]]);
    }
    if (data.currently_exporting === "Yes") {
      requireWhen(ctx, data, [["current_export_countries", "Current export countries"]]);
    }
  });

module.exports = {
  buyerServiceRequestSchema,
  supplierExportApplicationSchema,
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  buyerIntakeSchema,
  supplierApplicationSchema,
  contactLeadSchema,
  newsletterSubscribeSchema,
};
