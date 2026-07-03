const { z } = require("zod");
const SOURCING_CATEGORIES = require("../data/sourcingCategories");

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

module.exports = {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  buyerIntakeSchema,
  supplierApplicationSchema,
  contactLeadSchema,
};
