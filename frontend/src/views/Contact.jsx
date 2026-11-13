"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { COMPANY } from "@/constants/company";
import {
  TextField,
  TextAreaField,
  ConsentCheckbox,
  HoneypotField,
  focusFirstError,
} from "@/components/forms/FormControls";

const FIELD_ORDER = ["name", "email", "phone", "company", "message", "consent"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d][\d\s().-]{5,28}$/;

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = "Please enter your name.";
  else if (f.name.trim().length > 120) e.name = "Name is too long.";
  if (!f.email.trim()) e.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "Please enter a valid email address.";
  if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) e.phone = "Please enter a valid phone number, for example +65 1234 5678.";
  if (f.company.trim().length > 160) e.company = "Company name is too long.";
  if (!f.message.trim()) e.message = "Please write a message.";
  else if (f.message.trim().length < 10) e.message = "Please write at least 10 characters.";
  else if (f.message.trim().length > 5000) e.message = "Message must be 5,000 characters or fewer.";
  if (!f.consent) e.consent = "Please confirm you have read the Privacy Policy.";
  return e;
}

function ContactItem({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-4">
      <div className="w-11 h-11 rounded-full bg-[#EFF4F9] flex items-center justify-center text-[#012D76] shrink-0">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.14em] text-[#8A6F2B] font-semibold">{label}</p>
        <div className="mt-1 text-[#012D76] leading-relaxed break-words">{children}</div>
      </div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "", consent: false, fax_number: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const openedAt = useRef(Date.now());

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      focusFirstError(found, FIELD_ORDER);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leads", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        message: form.message.trim(),
        source: "contact-page",
        fax_number: form.fax_number, // honeypot: stays empty for real visitors
        elapsed_ms: Date.now() - openedAt.current,
      });
      setSentTo(form.email.trim());
    } catch (err) {
      setSubmitError(
        formatApiErrorDetail(err.response?.data?.detail) ||
          `We could not send your message. Please try again, or email ${COMPANY.contactEmail}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="contact-page">
      <section className="border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="overline mb-4">Contact Us</div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-light text-[#012D76]">Talk to {COMPANY.brandName}</h1>
          <p className="mt-6 text-[#3A4759] leading-relaxed max-w-2xl">
            Questions about sourcing, supplier qualification or export readiness? Send us a message or reach us directly. We usually reply within two working days.
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16">
          <div className="space-y-8">
            <h2 className="font-display text-2xl text-[#012D76]">Company details</h2>
            <ContactItem icon={Mail} label="Business email">
              <a href={`mailto:${COMPANY.contactEmail}`} className="underline underline-offset-2 hover:no-underline" data-testid="contact-email">{COMPANY.contactEmail}</a>
            </ContactItem>
            <ContactItem icon={Phone} label="Telephone / WhatsApp">
              <a href={COMPANY.phoneHref} className="underline underline-offset-2 hover:no-underline" data-testid="contact-phone">{COMPANY.phone}</a>
            </ContactItem>
            <ContactItem icon={MapPin} label="Registered office">
              <address className="not-italic" data-testid="contact-address">
                {COMPANY.legalName}<br />
                {COMPANY.addressStreet}<br />
                {COMPANY.addressCity} {COMPANY.addressPostalCode}<br />
                <span className="text-sm text-[#6B7280]">{COMPANY.registrationNumberLabel}: {COMPANY.registrationNumber}</span>
              </address>
            </ContactItem>
            <p className="text-sm text-[#3A4759] leading-relaxed border-t hairline pt-6">
              For privacy requests or to ask us to delete your data, see our{" "}
              <Link href="/data-deletion" className="text-[#012D76] underline underline-offset-2">Data Deletion page</Link>{" "}
              or <Link href="/privacy-policy" className="text-[#012D76] underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>

          <div>
            {sentTo ? (
              <div role="status" tabIndex={-1} className="border hairline bg-white p-8 lg:p-10" data-testid="contact-success">
                <CheckCircle2 size={40} className="text-[#2E7D32]" aria-hidden="true" />
                <h2 className="font-display text-2xl text-[#012D76] mt-5">Thank you, your message has been sent.</h2>
                <p className="mt-4 text-[#3A4759] leading-relaxed">
                  We will reply to {sentTo}, usually within two working days. If it is urgent, email us at{" "}
                  <a href={`mailto:${COMPANY.contactEmail}`} className="underline text-[#012D76]">{COMPANY.contactEmail}</a>.
                </p>
                <Link href="/" className="eec-btn-primary mt-8 inline-flex">Back to homepage <ArrowUpRight size={16} /></Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="relative border hairline bg-white p-6 sm:p-8 lg:p-10" aria-label="Contact form" data-testid="contact-form">
                <h2 className="font-display text-2xl text-[#012D76] mb-6">Send us a message</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <TextField name="name" label="Full name" value={form.name} onChange={set} error={errors.name} required autoComplete="name" />
                  <TextField name="email" label="Email address" type="email" value={form.email} onChange={set} error={errors.email} required autoComplete="email" />
                  <TextField name="phone" label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={set} error={errors.phone} optional autoComplete="tel" />
                  <TextField name="company" label="Company" value={form.company} onChange={set} error={errors.company} optional autoComplete="organization" />
                  <TextAreaField name="message" label="Message" rows={6} value={form.message} onChange={set} error={errors.message} required />
                  <HoneypotField value={form.fax_number} onChange={set} />
                  <ConsentCheckbox name="consent" checked={form.consent} onChange={set} error={errors.consent}>
                    I have read the{" "}
                    <Link href="/privacy-policy" className="text-[#012D76] underline" target="_blank">Privacy Policy</Link>{" "}
                    and agree that {COMPANY.legalName} may use my details to reply to this message.
                  </ConsentCheckbox>
                </div>

                {submitError && (
                  <p role="alert" className="mt-5 text-sm text-[#B42318]" data-testid="contact-error">{submitError}</p>
                )}

                <button type="submit" disabled={submitting} className="eec-btn-primary mt-6 disabled:opacity-60" data-testid="contact-submit">
                  {submitting ? (<><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending</>) : (<>Send message <ArrowUpRight size={16} aria-hidden="true" /></>)}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
