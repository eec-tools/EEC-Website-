import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Check, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STEPS = ["Company", "Profile & Portfolio", "Capacity & Categories", "Documents", "Submit"];

const ALL_CATEGORIES = ["Food Commodities", "Processed & Packaged Foods", "Fresh & Agricultural Products", "Healthcare & Hospital Textile Supplies", "Home Textile, Apparel & Hospitality Products", "Eco-Friendly, Sustainable & Organic Products"];
const DOC_TYPES = [
  { key: "iec", label: "IEC Certificate" },
  { key: "gst", label: "GST Registration" },
  { key: "iso", label: "ISO 9001" },
  { key: "other", label: "Other Certification" },
  { key: "catalog", label: "Product Catalog" },
  { key: "factory_image", label: "Factory Image" },
  { key: "portfolio", label: "Company Portfolio" },
];
const EXPERIENCE = ["No export experience yet", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

export default function SupplierApply() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: user?.company || "",
    headquarters_address: "",
    year_established: "",
    contact_name: user?.name || "",
    contact_position: "",
    contact_email: user?.email || "",
    contact_phone: "",
    additional_contact_name: "",
    additional_contact_position: "",
    additional_contact_email: "",
    additional_contact_phone: "",
    country: "India",
    state: "",
    iec_number: "",
    gst_number: "",
    company_overview: "",
    certifications_text: "",
    annual_revenue: "",
    key_markets: "",
    notable_clients: "",
    case_studies: "",
    languages_spoken: "",
    preferred_communication: "",
    special_capabilities: "",
    product_categories: [],
    product_description: "",
    annual_capacity: "",
    export_experience: "",
    factory_size: "",
    factory_locations: "",
    employee_count: "",
    website: "",
    documents: [], // {path, original_filename, doc_type, file_id}
    notes: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCategory = (c) =>
    set("product_categories", form.product_categories.includes(c)
      ? form.product_categories.filter((x) => x !== c)
      : [...form.product_categories, c]);

  const validate = () => {
    if (step === 0) return form.company_name && form.contact_name && form.contact_position && form.contact_email && form.contact_phone && form.country;
    if (step === 2) return form.product_categories.length > 0 && form.annual_capacity && form.export_experience;
    return true;
  };

  const next = () => {
    if (!validate()) { toast.error("Please complete required fields"); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB per file"); return; }
    setUploading(docType);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post(`/upload?doc_type=${docType}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("documents", [...form.documents, {
        file_id: data.file_id,
        path: data.storage_path,
        original_filename: data.original_filename,
        doc_type: docType,
      }]);
      toast.success(`${docType.toUpperCase()} uploaded`);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const removeDoc = (file_id) => set("documents", form.documents.filter((d) => d.file_id !== file_id));

  const submit = async () => {
    setSubmitting(true);
    try {
      const { certifications_text, ...rest } = form;
      const payload = {
        ...rest,
        certifications: certifications_text
          ? certifications_text.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      };
      await api.post("/supplier/application", payload);
      toast.success("Application submitted. Review window: 3-5 days.");
      navigate("/supplier", { replace: true });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16" data-testid="supplier-apply-page">
      <div className="overline mb-3">Supplier application</div>
      <h1 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-3">
        Apply to the EEC supplier network.
      </h1>
      <p className="text-[#3A4759] mb-10 max-w-2xl">
        Upload your IEC, GST and any certifications. We review applications within 3-5 business days.
      </p>

      <div className="flex items-center gap-2 mb-12">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2" data-testid={`sapp-step-${i}`}>
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
          <div className="space-y-8" data-testid="sapp-step-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company name *"><Input value={form.company_name} onChange={(v) => set("company_name", v)} testid="sapp-company" /></Field>
              <Field label="Website (optional)"><Input value={form.website} onChange={(v) => set("website", v)} testid="sapp-website" /></Field>
              <Field label="Headquarters address"><Input value={form.headquarters_address} onChange={(v) => set("headquarters_address", v)} testid="sapp-hq-address" /></Field>
              <Field label="Year established"><Input value={form.year_established} onChange={(v) => set("year_established", v)} testid="sapp-year-established" /></Field>
              <Field label="Country *"><Input value={form.country} onChange={(v) => set("country", v)} testid="sapp-country" /></Field>
              <Field label="State / Region"><Input value={form.state} onChange={(v) => set("state", v)} testid="sapp-state" /></Field>
              <Field label="IEC Number"><Input value={form.iec_number} onChange={(v) => set("iec_number", v)} testid="sapp-iec" /></Field>
              <Field label="GSTIN"><Input value={form.gst_number} onChange={(v) => set("gst_number", v)} testid="sapp-gst" /></Field>
            </div>

            <div>
              <div className="overline text-[#3A4759] mb-3">Primary contact</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact name *"><Input value={form.contact_name} onChange={(v) => set("contact_name", v)} testid="sapp-contact" /></Field>
                <Field label="Position / Title *"><Input value={form.contact_position} onChange={(v) => set("contact_position", v)} testid="sapp-contact-position" /></Field>
                <Field label="Contact email *"><Input type="email" value={form.contact_email} onChange={(v) => set("contact_email", v)} testid="sapp-email" /></Field>
                <Field label="Contact phone *"><Input value={form.contact_phone} onChange={(v) => set("contact_phone", v)} testid="sapp-phone" /></Field>
              </div>
            </div>

            <div>
              <div className="overline text-[#3A4759] mb-3">Additional contact (optional)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact name"><Input value={form.additional_contact_name} onChange={(v) => set("additional_contact_name", v)} testid="sapp-add-contact" /></Field>
                <Field label="Position / Title"><Input value={form.additional_contact_position} onChange={(v) => set("additional_contact_position", v)} testid="sapp-add-contact-position" /></Field>
                <Field label="Contact email"><Input type="email" value={form.additional_contact_email} onChange={(v) => set("additional_contact_email", v)} testid="sapp-add-email" /></Field>
                <Field label="Contact phone"><Input value={form.additional_contact_phone} onChange={(v) => set("additional_contact_phone", v)} testid="sapp-add-phone" /></Field>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6" data-testid="sapp-step-1">
            <Field label="Brief company overview">
              <textarea value={form.company_overview} onChange={(e) => set("company_overview", e.target.value)} rows={3}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="sapp-overview" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Industry / factory compliance certifications"><Input value={form.certifications_text} onChange={(v) => set("certifications_text", v)} placeholder="e.g. BSCI, GOTS, ISO 9001" testid="sapp-certifications" /></Field>
              <Field label="Annual revenue"><Input value={form.annual_revenue} onChange={(v) => set("annual_revenue", v)} testid="sapp-revenue" /></Field>
              <Field label="Key markets and regions"><Input value={form.key_markets} onChange={(v) => set("key_markets", v)} placeholder="e.g. EU, US, Middle East" testid="sapp-key-markets" /></Field>
              <Field label="Notable clients"><Input value={form.notable_clients} onChange={(v) => set("notable_clients", v)} testid="sapp-clients" /></Field>
              <Field label="Languages spoken"><Input value={form.languages_spoken} onChange={(v) => set("languages_spoken", v)} testid="sapp-languages" /></Field>
              <Field label="Preferred communication channels"><Input value={form.preferred_communication} onChange={(v) => set("preferred_communication", v)} placeholder="e.g. Email, WhatsApp, video call" testid="sapp-communication" /></Field>
            </div>
            <Field label="Case studies or success stories">
              <textarea value={form.case_studies} onChange={(e) => set("case_studies", e.target.value)} rows={3}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="sapp-case-studies" />
            </Field>
            <Field label="Special capabilities or technologies">
              <textarea value={form.special_capabilities} onChange={(e) => set("special_capabilities", e.target.value)} rows={3}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="sapp-capabilities" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6" data-testid="sapp-step-2">
            <div>
              <div className="overline text-[#3A4759] mb-3">Product categories *</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALL_CATEGORIES.map((c) => {
                  const active = form.product_categories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      data-testid={`sapp-cat-${c}`}
                      className={`text-left p-3 text-sm border transition-colors ${active ? "border-[#C9A23F] bg-[#C9A23F]/10 text-[#012D76]" : "border-[#E5EBF2] text-[#3A4759] hover:border-[#012D76]/35"}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Product descriptions">
              <textarea value={form.product_description} onChange={(e) => set("product_description", e.target.value)} rows={3}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="sapp-product-description" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Annual production capacity *"><Input value={form.annual_capacity} onChange={(v) => set("annual_capacity", v)} placeholder="e.g. 800,000 units / yr" testid="sapp-capacity" /></Field>
              <Field label="Export experience *">
                <select value={form.export_experience} onChange={(e) => set("export_experience", e.target.value)}
                  className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                  data-testid="sapp-experience">
                  <option value="">Select</option>
                  {EXPERIENCE.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
              <Field label="Factory locations"><Input value={form.factory_locations} onChange={(v) => set("factory_locations", v)} testid="sapp-factory-locations" /></Field>
              <Field label="Factory size (sqft)"><Input value={form.factory_size} onChange={(v) => set("factory_size", v)} testid="sapp-size" /></Field>
              <Field label="Employees"><Input value={form.employee_count} onChange={(v) => set("employee_count", v)} testid="sapp-employees" /></Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6" data-testid="sapp-step-3">
            <p className="text-sm text-[#3A4759]">Upload PDF, JPG or PNG files. Max 10 MB each.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOC_TYPES.map((d) => (
                <label key={d.key} className="border hairline border-dashed p-6 flex flex-col items-start gap-3 cursor-pointer hover:border-[#C9A23F]/50 transition-colors" data-testid={`sapp-upload-${d.key}`}>
                  <Upload size={18} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" />
                  <div>
                    <div className="text-[#012D76] font-display">{d.label}</div>
                    <div className="text-xs text-[#6B7280] mt-1">
                      {uploading === d.key ? "Uploading…" : "Click to upload"}
                    </div>
                  </div>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden"
                    onChange={(e) => onUpload(e, d.key)} disabled={uploading === d.key} />
                </label>
              ))}
            </div>
            {form.documents.length > 0 && (
              <div className="border hairline">
                {form.documents.map((d) => (
                  <div key={d.file_id} className="p-4 flex items-center justify-between border-b hairline last:border-0">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" />
                      <div>
                        <div className="text-sm text-[#012D76]">{d.original_filename}</div>
                        <div className="text-xs text-[#6B7280] uppercase tracking-widest">{d.doc_type}</div>
                      </div>
                    </div>
                    <button onClick={() => removeDoc(d.file_id)} className="text-[#6B7280] hover:text-[#012D76]" data-testid={`sapp-remove-${d.file_id}`}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4" data-testid="sapp-step-4">
            <div className="overline">Review &amp; submit</div>
            <h2 className="font-display text-2xl text-[#012D76]">Final review</h2>
            <div className="border hairline">
              {[
                ["Company", form.company_name],
                ["Headquarters", form.headquarters_address || "—"],
                ["Contact", `${form.contact_name} (${form.contact_position || "—"}) · ${form.contact_email} · ${form.contact_phone}`],
                ["Location", `${form.country}${form.state ? ", " + form.state : ""}`],
                ["Key markets", form.key_markets || "—"],
                ["Categories", form.product_categories.join(", ")],
                ["Capacity", form.annual_capacity],
                ["Experience", form.export_experience],
                ["IEC / GST", `${form.iec_number || "—"} / ${form.gst_number || "—"}`],
                ["Documents", `${form.documents.length} uploaded`],
              ].map(([k, v], i) => (
                <div key={k} className={`grid grid-cols-3 gap-4 p-4 ${i !== 0 ? "border-t hairline" : ""}`}>
                  <div className="text-xs uppercase tracking-widest text-[#6B7280]">{k}</div>
                  <div className="col-span-2 text-[#012D76]/95 text-sm">{v || <span className="text-[#012D76]/35">—</span>}</div>
                </div>
              ))}
            </div>
            <Field label="Anything else?">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
                className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="sapp-notes" />
            </Field>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button onClick={back} disabled={step === 0} className="eec-btn-secondary disabled:opacity-30" data-testid="sapp-back">
            <ChevronLeft size={14} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="eec-btn-primary" data-testid="sapp-next">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="eec-btn-primary" data-testid="sapp-submit">
              {submitting ? "Submitting…" : "Submit application"} <ArrowUpRight size={14} />
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
