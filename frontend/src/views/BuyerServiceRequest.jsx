"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Paperclip, X } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { BUYER_OFFERS, CUSTOM_SOURCING_OFFER, PURCHASING_TIMELINES } from "@/constants/services";
import {
  FormSection,
  TextField,
  TextAreaField,
  SelectField,
  RadioCards,
  ConsentCheckbox,
  HoneypotField,
  FieldError,
  focusFirstError,
  isEmail,
} from "@/components/forms/FormControls";
import SubmissionSuccess from "@/components/forms/SubmissionSuccess";

const SERVICE_OPTIONS = [
  ...BUYER_OFFERS.map((o) => ({ value: o.id, label: o.title, sub: o.facts?.join(" · ") })),
  { value: CUSTOM_SOURCING_OFFER.id, label: CUSTOM_SOURCING_OFFER.title, sub: "Scoped and priced individually" },
];
const REGISTRATION_OPTIONS = [
  { value: "provided", label: "I have a company registration number" },
  { value: "not-available", label: "Not available / I need help", sub: "You can still submit. EEC completes the registration check before accepting a paid assignment." },
];
const SERVICE_IDS = SERVICE_OPTIONS.map((o) => o.value);

const MAX_FILES = 3;
const MAX_TOTAL_MB = 4;
const ACCEPTED_FILES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp";

// Order used to focus the first invalid field.
const FIELD_ORDER = [
  "full_name", "company_name", "company_website", "country",
  "registration_status", "registration_number", "registration_country", "company_linkedin",
  "business_email", "contact_number", "service", "product_category", "supplier_name", "supplier_website", "supplier_country",
  "product_specifications", "destination_country", "order_quantity", "purchasing_timeline",
  "supporting_documents", "consent_accuracy_privacy", "consent_service_terms",
];

const REQUIRED_ALWAYS = {
  full_name: "Full name",
  company_name: "Company name",
  company_website: "Company website",
  country: "Country",
  business_email: "Business email",
  contact_number: "Contact number",
  product_category: "Product / product category",
};

const isSourcing = (service) => service === "feasibility-snapshot" || service === "custom-sourcing";

function validate(form, files) {
  const errors = {};
  for (const [key, label] of Object.entries(REQUIRED_ALWAYS)) {
    if (!form[key].trim()) errors[key] = `${label} is required.`;
  }
  if (form.business_email.trim() && !isEmail(form.business_email)) {
    errors.business_email = "Enter a valid business email address.";
  }
  if (!form.registration_status) {
    errors.registration_status = "Tell us whether you have a company registration number.";
  } else if (form.registration_status === "provided") {
    if (!form.registration_number.trim()) errors.registration_number = "Registration number is required.";
    if (!form.registration_country.trim()) errors.registration_country = "Country of registration is required.";
  } else if (!form.company_linkedin.trim()) {
    errors.company_linkedin = "Company LinkedIn page is required if you have no registration number.";
  }
  if (!form.service) errors.service = "Select a service.";
  if (form.service === "background-check") {
    if (!form.supplier_name.trim()) errors.supplier_name = "Supplier name is required.";
    if (!form.supplier_website.trim()) errors.supplier_website = "Supplier website is required.";
    if (!form.supplier_country.trim()) errors.supplier_country = "Supplier country is required.";
  }
  if (form.service === "feasibility-snapshot") {
    if (!form.product_specifications.trim()) errors.product_specifications = "Product specifications are required.";
    if (!form.destination_country.trim()) errors.destination_country = "Intended destination country is required.";
  }
  if (isSourcing(form.service)) {
    if (!form.order_quantity.trim()) errors.order_quantity = "Estimated order quantity is required.";
    if (!form.purchasing_timeline) errors.purchasing_timeline = "Expected purchasing timeline is required.";
  }
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
    errors.supporting_documents = `Supporting documents must be ${MAX_TOTAL_MB} MB or less in total.`;
  }
  if (!form.consent_accuracy_privacy) errors.consent_accuracy_privacy = "Please tick this box to continue.";
  if (!form.consent_service_terms) errors.consent_service_terms = "Please agree to the Service Terms to continue.";
  return errors;
}

export default function BuyerServiceRequest() {
  const params = useSearchParams();
  const preselected = params.get("service");

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    company_website: "",
    country: "",
    registration_status: "",
    registration_number: "",
    registration_country: "",
    company_linkedin: "",
    business_email: "",
    contact_number: "",
    service: SERVICE_IDS.includes(preselected) ? preselected : "",
    product_category: "",
    supplier_name: "",
    supplier_website: "",
    supplier_country: "",
    product_specifications: "",
    destination_country: "",
    order_quantity: "",
    purchasing_timeline: "",
    additional_information: "",
    consent_accuracy_privacy: false,
    consent_service_terms: false,
    fax_number: "",
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Always open the form at the top, even when arriving from a button lower down another page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const addFiles = (list) => {
    const next = [...files, ...Array.from(list)].slice(0, MAX_FILES);
    setFiles(next);
    setErrors((e) => ({ ...e, supporting_documents: undefined }));
  };
  const removeFile = (i) => setFiles((fs) => fs.filter((_, idx) => idx !== i));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const found = validate(form, files);
    setErrors(found);
    if (Object.keys(found).length) {
      focusFirstError(found, FIELD_ORDER);
      return;
    }

    // Only send the fields that apply to the selected service.
    const payload = { ...form };
    if (form.registration_status === "provided") {
      payload.company_linkedin = "";
    } else {
      payload.registration_number = payload.registration_country = "";
    }
    if (form.service !== "background-check") {
      payload.supplier_name = payload.supplier_website = payload.supplier_country = "";
    }
    if (form.service !== "feasibility-snapshot") {
      payload.product_specifications = payload.destination_country = "";
    }
    if (!isSourcing(form.service)) {
      payload.order_quantity = payload.purchasing_timeline = "";
    }

    const body = new FormData();
    for (const [k, v] of Object.entries(payload)) body.append(k, typeof v === "boolean" ? String(v) : v);
    for (const f of files) body.append("supporting_documents", f);

    setSubmitting(true);
    try {
      const { data } = await api.post("/service-requests/buyer", body);
      setResult({ reference: data.reference, confirmationSent: data.confirmation_sent, email: form.business_email.trim() });
    } catch (err) {
      setSubmitError(
        formatApiErrorDetail(err.response?.data?.detail) ||
          "We could not submit your request. Please try again, or email partners@eectrade.com."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-14 lg:py-16" data-testid="buyer-service-request-page">
      <div className="overline mb-3">EEC Buyer Services</div>
      <h1 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-3">
        Request an EEC Buyer Service
      </h1>

      {result ? (
        <div className="mt-8">
          <SubmissionSuccess
            heading="Thank you. Your service request has been received."
            reference={result.reference}
            email={result.email}
            confirmationSent={result.confirmationSent}
            nextSteps="EEC will review your request and contact you with the next steps. No payment is due at this stage."
            backHref="/for-buyers#buyer-services"
            backLabel="Back to Buyer Services"
          />
        </div>
      ) : (
        <>
          <p className="text-[#3A4759] mb-10 max-w-2xl leading-relaxed">
            Tell us what you need and EEC will review your request and contact you with the next steps. Fields
            marked <span className="text-[#B42318]">*</span> are required. No payment is taken through this form.
          </p>

          <form onSubmit={onSubmit} noValidate className="relative border hairline bg-surface p-6 sm:p-8 lg:p-10 space-y-8" data-testid="buyer-service-request-form">
            <FormSection title="Your details">
              <TextField name="full_name" label="Full name" required autoComplete="name" value={form.full_name} onChange={set} error={errors.full_name} />
              <TextField name="company_name" label="Company name" required autoComplete="organization" value={form.company_name} onChange={set} error={errors.company_name} />
              <TextField name="company_website" label="Company website" required type="url" inputMode="url" autoComplete="url" placeholder="www.example.com" value={form.company_website} onChange={set} error={errors.company_website} />
              <TextField name="country" label="Country" required autoComplete="country-name" value={form.country} onChange={set} error={errors.country} />
              <RadioCards name="registration_status" label="Company registration" required columns={2} options={REGISTRATION_OPTIONS} value={form.registration_status} onChange={set} error={errors.registration_status} />
              {form.registration_status === "provided" && (
                <>
                  <TextField name="registration_number" label="Registration number" required hint="For example a Companies House number, CIN, EIN, ABN or trade licence number." value={form.registration_number} onChange={set} error={errors.registration_number} />
                  <TextField name="registration_country" label="Country of registration" required value={form.registration_country} onChange={set} error={errors.registration_country} />
                </>
              )}
              {form.registration_status === "not-available" && (
                <TextField name="company_linkedin" label="Company LinkedIn page" required full type="url" inputMode="url" placeholder="linkedin.com/company/your-company" hint="Please also use your company email address below, not a personal one." value={form.company_linkedin} onChange={set} error={errors.company_linkedin} />
              )}
              <TextField name="business_email" label="Business email" required type="email" autoComplete="email" value={form.business_email} onChange={set} error={errors.business_email} />
              <TextField name="contact_number" label="Contact number" required type="tel" autoComplete="tel" placeholder="Include country code" value={form.contact_number} onChange={set} error={errors.contact_number} />
            </FormSection>

            <FormSection title="Your request">
              <RadioCards name="service" label="Select service" required columns={3} options={SERVICE_OPTIONS} value={form.service} onChange={set} error={errors.service} />
              <TextField name="product_category" label="Product / product category" required full value={form.product_category} onChange={set} error={errors.product_category} />

              {form.service === "background-check" && (
                <>
                  <div className="md:col-span-2 text-sm text-[#3A4759]">Tell us about the supplier you would like checked.</div>
                  <TextField name="supplier_name" label="Supplier name" required value={form.supplier_name} onChange={set} error={errors.supplier_name} />
                  <TextField name="supplier_country" label="Supplier country" required value={form.supplier_country} onChange={set} error={errors.supplier_country} />
                  <TextField name="supplier_website" label="Supplier website" required full hint="If the supplier has no website, write “None”." value={form.supplier_website} onChange={set} error={errors.supplier_website} />
                </>
              )}

              {form.service === "feasibility-snapshot" && (
                <>
                  <TextAreaField name="product_specifications" label="Product specifications" required placeholder="Material, grade, size, packaging, certifications…" value={form.product_specifications} onChange={set} error={errors.product_specifications} />
                  <TextField name="destination_country" label="Intended destination country" required value={form.destination_country} onChange={set} error={errors.destination_country} />
                </>
              )}

              {isSourcing(form.service) && (
                <>
                  <TextField name="order_quantity" label="Estimated order quantity" required placeholder="e.g. 2 containers per month" value={form.order_quantity} onChange={set} error={errors.order_quantity} />
                  <SelectField name="purchasing_timeline" label="Expected purchasing timeline" required options={PURCHASING_TIMELINES} value={form.purchasing_timeline} onChange={set} error={errors.purchasing_timeline} />
                </>
              )}

              <TextAreaField name="additional_information" label="Additional information" optional value={form.additional_information} onChange={set} />

              <div className="md:col-span-2">
                <div className="block text-sm font-medium text-[#012D76]">
                  Supporting documents <span className="font-normal text-[#6B7280]">(optional)</span>
                </div>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Up to {MAX_FILES} files, {MAX_TOTAL_MB} MB in total. PDF, Word, Excel or image files.
                </p>
                {files.length < MAX_FILES && (
                  <label
                    id="f-supporting_documents"
                    className={`mt-2 flex cursor-pointer items-center justify-center gap-2 border border-dashed px-4 py-5 text-sm text-[#012D76] bg-white hover:border-[#012D76]/50 ${errors.supporting_documents ? "border-[#B42318]" : "hairline"}`}
                  >
                    <Paperclip size={16} aria-hidden="true" /> Choose files
                    <input
                      type="file"
                      multiple
                      accept={ACCEPTED_FILES}
                      className="sr-only"
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                      data-testid="field-supporting_documents"
                    />
                  </label>
                )}
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 border hairline bg-white px-4 py-2 text-sm text-[#012D76]">
                        <span className="truncate">{f.name} <span className="text-[#6B7280]">({(f.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                        <button type="button" onClick={() => removeFile(i)} className="p-1 text-[#6B7280] hover:text-[#B42318]" aria-label={`Remove ${f.name}`}>
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <FieldError id="f-supporting_documents-error" error={errors.supporting_documents} />
              </div>
            </FormSection>

            <FormSection title="Confirmation">
              <ConsentCheckbox name="consent_accuracy_privacy" checked={form.consent_accuracy_privacy} onChange={set} error={errors.consent_accuracy_privacy}>
                I confirm that the information provided is accurate to the best of my knowledge and agree to EEC
                contacting me regarding this enquiry and processing my information under its{" "}
                <Link href="/privacy" target="_blank" rel="noopener" className="underline text-[#012D76]">
                  Privacy Policy
                </Link>
                .
              </ConsentCheckbox>
              <ConsentCheckbox name="consent_service_terms" checked={form.consent_service_terms} onChange={set} error={errors.consent_service_terms}>
                I have read and agree to the{" "}
                <Link href="/for-buyers#service-terms" target="_blank" rel="noopener" className="underline text-[#012D76]">
                  Service Terms
                </Link>
                .
              </ConsentCheckbox>
            </FormSection>

            {submitError && (
              <p className="border border-[#B42318] bg-[#FEF3F2] p-4 text-sm text-[#B42318]" role="alert" data-testid="submit-error">
                {submitError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button type="submit" disabled={submitting} className="eec-btn-primary disabled:opacity-60" data-testid="submit-service-request">
                {submitting ? "Submitting…" : "Submit Service Request"} <ArrowUpRight size={16} />
              </button>
              <Link href="/privacy" target="_blank" rel="noopener" className="text-sm text-[#3A4759] underline">
                Privacy Policy
              </Link>
            </div>
            <HoneypotField value={form.fax_number} onChange={set} />
          </form>
        </>
      )}
    </div>
  );
}
