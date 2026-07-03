import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STEPS = ["Company", "Product brief", "Volumes & timeline", "Submit"];

const CATEGORIES = ["Food Commodities", "Processed & Packaged Foods", "Fresh & Agricultural Products", "Healthcare & Hospital Textile Supplies", "Home Textile, Apparel & Hospitality Products", "Eco-Friendly, Sustainable & Organic Products", "Other"];
const TIMELINES = ["Within 30 days", "1-3 months", "3-6 months", "6-12 months", "Exploratory"];

export default function BuyerIntake() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: user?.company || "",
    contact_name: user?.name || "",
    contact_email: user?.email || "",
    contact_phone: "",
    country: "",
    product_category: "",
    product_specs: "",
    annual_volume: "",
    target_price: "",
    timeline: "",
    pain_points: "",
    additional_notes: "",
  });
  const navigate = useNavigate();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (step === 0) return form.company_name && form.contact_name && form.contact_email && form.country;
    if (step === 1) return form.product_category && form.product_specs;
    if (step === 2) return form.annual_volume && form.timeline;
    return true;
  };

  const next = () => {
    if (!validateStep()) { toast.error("Please complete required fields"); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post("/buyer/intake", form);
      toast.success("Brief submitted. We will be in touch within 24 hours.");
      if (user) navigate("/buyer", { replace: true });
      else navigate("/");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16" data-testid="buyer-intake-page">
      <div className="overline mb-3">Buyer Intake</div>
      <h1 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-3">
        Tell us about your sourcing need.
      </h1>
      <p className="text-[#3A4759] mb-10 max-w-2xl">
        4 steps. ~3 minutes. We will come back to you with category benchmarks and a sourcing approach
        within 24 hours.
      </p>

      <div className="flex items-center gap-2 mb-12">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2" data-testid={`intake-step-${i}`}>
            <div className={`h-8 w-8 flex items-center justify-center border ${i <= step ? "border-[#C9A23F] text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" : "border-[#E5EBF2] text-[#6B7280]"} text-xs`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs uppercase tracking-widest ${i <= step ? "text-[#012D76]" : "text-[#6B7280]"} hidden sm:block`}>{s}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[#012D76]/10 ml-2" />}
          </div>
        ))}
      </div>

      <div className="border hairline bg-surface p-8">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="intake-step-0-fields">
            <Field label="Company name *"><Input value={form.company_name} onChange={(v) => set("company_name", v)} testid="intake-company" /></Field>
            <Field label="Country *"><Input value={form.country} onChange={(v) => set("country", v)} testid="intake-country" /></Field>
            <Field label="Contact name *"><Input value={form.contact_name} onChange={(v) => set("contact_name", v)} testid="intake-contact-name" /></Field>
            <Field label="Contact email *"><Input type="email" value={form.contact_email} onChange={(v) => set("contact_email", v)} testid="intake-contact-email" /></Field>
            <Field label="Phone (optional)"><Input value={form.contact_phone} onChange={(v) => set("contact_phone", v)} testid="intake-phone" /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4" data-testid="intake-step-1-fields">
            <Field label="Product category *">
              <select
                value={form.product_category}
                onChange={(e) => set("product_category", e.target.value)}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="intake-category"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Product specifications *">
              <textarea value={form.product_specs} onChange={(e) => set("product_specs", e.target.value)} rows={5}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                placeholder="What are you buying? Material, size, certifications, packaging…"
                data-testid="intake-specs" />
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="intake-step-2-fields">
            <Field label="Annual volume *"><Input value={form.annual_volume} onChange={(v) => set("annual_volume", v)} placeholder="e.g. 120,000 units / year" testid="intake-volume" /></Field>
            <Field label="Target landed cost"><Input value={form.target_price} onChange={(v) => set("target_price", v)} placeholder="e.g. target unit cost DDP NYC" testid="intake-price" /></Field>
            <Field label="Timeline *">
              <select
                value={form.timeline}
                onChange={(e) => set("timeline", e.target.value)}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="intake-timeline"
              >
                <option value="">Select timeline</option>
                {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Current pain points">
              <textarea value={form.pain_points} onChange={(e) => set("pain_points", e.target.value)} rows={3}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                placeholder="QC issues, lead times, capacity, pricing…"
                data-testid="intake-pain" />
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4" data-testid="intake-step-3-summary">
            <div className="overline">Review &amp; submit</div>
            <h2 className="font-display text-2xl text-[#012D76]">Looks good?</h2>
            <div className="border hairline mt-6">
              {[
                ["Company", form.company_name],
                ["Contact", `${form.contact_name} · ${form.contact_email}`],
                ["Country", form.country],
                ["Category", form.product_category],
                ["Volume", form.annual_volume],
                ["Timeline", form.timeline],
                ["Specs", form.product_specs],
              ].map(([k, v], i) => (
                <div key={k} className={`grid grid-cols-3 gap-4 p-4 ${i !== 0 ? "border-t hairline" : ""}`}>
                  <div className="text-xs uppercase tracking-widest text-[#6B7280]">{k}</div>
                  <div className="col-span-2 text-[#012D76]/95 text-sm">{v || <span className="text-[#012D76]/35">—</span>}</div>
                </div>
              ))}
            </div>
            <Field label="Anything else?">
              <textarea value={form.additional_notes} onChange={(e) => set("additional_notes", e.target.value)} rows={3}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="intake-notes" />
            </Field>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button onClick={back} disabled={step === 0} className="eec-btn-secondary disabled:opacity-30" data-testid="intake-back">
            <ChevronLeft size={14} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="eec-btn-primary" data-testid="intake-next">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="eec-btn-primary" data-testid="intake-submit">
              {submitting ? "Submitting…" : "Submit brief"} <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="overline text-[#3A4759]">{label}</span>{children}</label>;
}
function Input({ value, onChange, type = "text", placeholder, testid }) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
      data-testid={testid}
    />
  );
}
