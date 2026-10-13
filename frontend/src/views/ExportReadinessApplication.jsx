"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { SUPPLIER_SUPPORT_OPTIONS, SUPPLIER_BUSINESS_TYPES } from "@/constants/services";
import {
  FormSection,
  TextField,
  TextAreaField,
  RadioCards,
  ConsentCheckbox,
  HoneypotField,
  focusFirstError,
  isEmail,
} from "@/components/forms/FormControls";
import SubmissionSuccess from "@/components/forms/SubmissionSuccess";

const SUPPORT_IDS = SUPPLIER_SUPPORT_OPTIONS.map((o) => o.value);
const BUSINESS_TYPE_OPTIONS = SUPPLIER_BUSINESS_TYPES.map((t) => ({ value: t, label: t }));
const EXPORTING_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const REGISTRATION_OPTIONS = [
  { value: "provided", label: "I have a company registration number" },
  { value: "not-available", label: "Not available / I need help", sub: "You can still submit. EEC completes the registration check before accepting a paid assignment." },
];

const FIELD_ORDER = [
  "full_name", "company_name", "country", "company_website",
  "registration_status", "registration_number", "registration_country", "company_linkedin",
  "business_email", "contact_number",
  "business_type", "main_product", "currently_exporting", "current_export_countries",
  "target_export_countries", "main_export_challenges", "support_sought", "support_type",
  "consent_eligibility_privacy",
];

const REQUIRED_TEXT = {
  full_name: "Full name",
  company_name: "Company name",
  country: "Country",
  company_website: "Company website",
  business_email: "Business email",
  contact_number: "Contact number",
  main_product: "Main product / product category",
  target_export_countries: "Target export countries",
  main_export_challenges: "Main export challenges",
  support_sought: "What support you are seeking",
};

function validate(form) {
  const errors = {};
  for (const [key, label] of Object.entries(REQUIRED_TEXT)) {
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
  if (!form.business_type) errors.business_type = "Select one option.";
  if (!form.currently_exporting) errors.currently_exporting = "Select Yes or No.";
  if (form.currently_exporting === "Yes" && !form.current_export_countries.trim()) {
    errors.current_export_countries = "Current export countries are required.";
  }
  if (!form.support_type) errors.support_type = "Select the type of support you are applying for.";
  if (!form.consent_eligibility_privacy) errors.consent_eligibility_privacy = "Please tick this box to continue.";
  return errors;
}

export default function ExportReadinessApplication() {
  const params = useSearchParams();
  const preselected = params.get("support");

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    country: "",
    company_website: "",
    registration_status: "",
    registration_number: "",
    registration_country: "",
    company_linkedin: "",
    business_email: "",
    contact_number: "",
    business_type: "",
    main_product: "",
    currently_exporting: "",
    current_export_countries: "",
    target_export_countries: "",
    main_export_challenges: "",
    support_sought: "",
    support_type: SUPPORT_IDS.includes(preselected) ? preselected : "",
    consent_eligibility_privacy: false,
    fax_number: "",
  });
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      focusFirstError(found, FIELD_ORDER);
      return;
    }

    const payload = { ...form };
    if (form.registration_status === "provided") {
      payload.company_linkedin = "";
    } else {
      payload.registration_number = payload.registration_country = "";
    }
    if (form.currently_exporting !== "Yes") payload.current_export_countries = "";

    setSubmitting(true);
    try {
      const { data } = await api.post("/service-requests/supplier", payload);
      setResult({ reference: data.reference, confirmationSent: data.confirmation_sent, email: form.business_email.trim() });
    } catch (err) {
      setSubmitError(
        formatApiErrorDetail(err.response?.data?.detail) ||
          "We could not submit your application. Please try again, or email partners@eectrade.com."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-14 lg:py-16" data-testid="export-readiness-application-page">
      <div className="overline mb-3">EEC Export Support</div>
      <h1 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-3">
        Apply for EEC Export Readiness Support
      </h1>

      {result ? (
        <div className="mt-8">
          <SubmissionSuccess
            heading="Thank you. Your application has been received."
            reference={result.reference}
            email={result.email}
            confirmationSent={result.confirmationSent}
            nextSteps={
              form.support_type === "complimentary-diagnostic"
                ? "EEC will review your application and contact you with the next steps. The complimentary pilot is subject to EEC's eligibility review and acceptance is not guaranteed."
                : "EEC will review your application and contact you with the next steps."
            }
            backHref="/for-suppliers#export-readiness"
            backLabel="Back to Export Support"
          />
        </div>
      ) : (
        <>
          <p className="text-[#3A4759] mb-10 max-w-2xl leading-relaxed">
            For manufacturers and exporters applying for the Export Readiness Diagnostic Pilot or paid export support.
            This is separate from joining the EEC supplier network. Fields marked{" "}
            <span className="text-[#B42318]">*</span> are required.
          </p>

          <form onSubmit={onSubmit} noValidate className="relative border hairline bg-surface p-6 sm:p-8 lg:p-10 space-y-8" data-testid="export-readiness-application-form">
            <FormSection title="Your details">
              <TextField name="full_name" label="Full name" required autoComplete="name" value={form.full_name} onChange={set} error={errors.full_name} />
              <TextField name="company_name" label="Company name" required autoComplete="organization" value={form.company_name} onChange={set} error={errors.company_name} />
              <TextField name="country" label="Country" required autoComplete="country-name" value={form.country} onChange={set} error={errors.country} />
              <TextField name="company_website" label="Company website" required type="url" inputMode="url" autoComplete="url" placeholder="www.example.com" value={form.company_website} onChange={set} error={errors.company_website} />
              <RadioCards name="registration_status" label="Company registration" required columns={2} options={REGISTRATION_OPTIONS} value={form.registration_status} onChange={set} error={errors.registration_status} />
              {form.registration_status === "provided" && (
                <>
                  <TextField name="registration_number" label="Registration number" required hint="For example a GSTIN, CIN, IEC, Udyam or trade licence number." value={form.registration_number} onChange={set} error={errors.registration_number} />
                  <TextField name="registration_country" label="Country of registration" required value={form.registration_country} onChange={set} error={errors.registration_country} />
                </>
              )}
              {form.registration_status === "not-available" && (
                <TextField name="company_linkedin" label="Company LinkedIn page" required full type="url" inputMode="url" placeholder="linkedin.com/company/your-company" hint="Please also use your company email address below, not a personal one." value={form.company_linkedin} onChange={set} error={errors.company_linkedin} />
              )}
              <TextField name="business_email" label="Business email" required type="email" autoComplete="email" value={form.business_email} onChange={set} error={errors.business_email} />
              <TextField name="contact_number" label="Contact number" required type="tel" autoComplete="tel" placeholder="Include country code" value={form.contact_number} onChange={set} error={errors.contact_number} />
            </FormSection>

            <FormSection title="Your business">
              <RadioCards name="business_type" label="Are you a manufacturer, exporter or trader?" required columns={2} options={BUSINESS_TYPE_OPTIONS} value={form.business_type} onChange={set} error={errors.business_type} />
              <TextField name="main_product" label="Main product / product category" required full value={form.main_product} onChange={set} error={errors.main_product} />
              <RadioCards name="currently_exporting" label="Are you currently exporting?" required columns={2} options={EXPORTING_OPTIONS} value={form.currently_exporting} onChange={set} error={errors.currently_exporting} />
              {form.currently_exporting === "Yes" && (
                <TextField name="current_export_countries" label="Current export countries" required full value={form.current_export_countries} onChange={set} error={errors.current_export_countries} />
              )}
              <TextField name="target_export_countries" label="Target export countries" required full value={form.target_export_countries} onChange={set} error={errors.target_export_countries} />
            </FormSection>

            <FormSection title="Support needed">
              <TextAreaField name="main_export_challenges" label="Main export challenges" required value={form.main_export_challenges} onChange={set} error={errors.main_export_challenges} />
              <TextAreaField name="support_sought" label="What support are you seeking?" required value={form.support_sought} onChange={set} error={errors.support_sought} />
              <RadioCards name="support_type" label="Select" required columns={2} options={SUPPLIER_SUPPORT_OPTIONS} value={form.support_type} onChange={set} error={errors.support_type} />
            </FormSection>

            <FormSection title="Confirmation">
              <ConsentCheckbox name="consent_eligibility_privacy" checked={form.consent_eligibility_privacy} onChange={set} error={errors.consent_eligibility_privacy}>
                I understand that the complimentary pilot is subject to EEC&apos;s eligibility review and does not
                guarantee acceptance. I agree to EEC contacting me and processing my information under its{" "}
                <Link href="/privacy" target="_blank" rel="noopener" className="underline text-[#012D76]">
                  Privacy Policy
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
              <button type="submit" disabled={submitting} className="eec-btn-primary disabled:opacity-60" data-testid="submit-application">
                {submitting ? "Submitting…" : "Submit Application"} <ArrowUpRight size={16} />
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
