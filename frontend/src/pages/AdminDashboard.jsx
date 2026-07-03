import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Factory, ClipboardCheck, FileText, Search, ChevronDown, ChevronRight,
  Globe2, Mail, Phone, ArrowUpRight, Building2, Trash2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import DocumentRow from "@/components/DocumentRow";
import PortalShell from "@/components/PortalShell";

function DeleteUserButton({ userId, label, onDeleted }) {
  const [busy, setBusy] = React.useState(false);
  if (!userId) return null;
  const onClick = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete this account?\n\n${label}\n\nThis permanently removes the user, all their applications/intakes, and uploaded documents (including S3 files). This cannot be undone.`)) return;
    setBusy(true);
    try {
      const { data } = await api.delete(`/admin/users/${userId}`);
      const d = data.deleted || {};
      toast.success(
        `Deleted: user, ${d.supplier_applications || 0} apps, ${d.buyer_intakes || 0} briefs, ${d.files || 0} docs (${d.s3_objects_deleted || 0} S3 objects)`
      );
      onDeleted && onDeleted(userId);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Delete failed";
      toast.error(typeof msg === "string" ? msg : "Delete failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title="Delete this account and all their data"
      className="inline-flex items-center justify-center h-8 w-8 text-[#B23B3B] hover:bg-[#B23B3B]/10 border border-transparent hover:border-[#B23B3B]/30 transition-colors disabled:opacity-40"
      data-testid={`admin-delete-user-${userId}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}

const STATUS_COLORS = {
  new: "text-[#0096D6]",
  pending_review: "text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]",
  approved: "text-[#0F8B5C]",
  rejected: "text-[#B23B3B]",
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="border hairline bg-surface p-6" data-testid={`admin-stat-${label.toLowerCase()}`}>
      <Icon size={18} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" />
      <div className="font-display text-3xl text-[#012D76] mt-4">{value}</div>
      <div className="text-xs text-[#6B7280] mt-2 tracking-widest uppercase">{label}</div>
      {sub && <div className="text-xs text-[#6B7280] mt-1">{sub}</div>}
    </div>
  );
}

function SupplierApplicationRow({ app, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const docs = app.documents || [];
  const status = app.status || "pending_review";

  return (
    <div className="border-b hairline last:border-0" data-testid={`admin-sapp-${app.application_id}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-5 lg:p-6 hover:bg-[#F5F9FC] transition-colors"
        data-testid={`admin-sapp-toggle-${app.application_id}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4 flex items-center gap-3">
            {open ? <ChevronDown size={16} className="text-[#6B7280] shrink-0" /> : <ChevronRight size={16} className="text-[#6B7280] shrink-0" />}
            <div className="min-w-0">
              <div className="font-display text-lg text-[#012D76] truncate">{app.company_name}</div>
              <div className="text-xs text-[#6B7280] mt-1 truncate">
                {app.contact_name} · {app.country}{app.state ? `, ${app.state}` : ""}
              </div>
            </div>
          </div>
          <div className="md:col-span-3 text-sm text-[#3A4759]">
            {(app.product_categories || []).slice(0, 2).join(", ") || <span className="text-[#6B7280]">—</span>}
          </div>
          <div className="md:col-span-2 text-sm text-[#3A4759]">{app.annual_capacity || "—"}</div>
          <div className="md:col-span-2 text-sm text-[#3A4759]">
            {docs.length} {docs.length === 1 ? "doc" : "docs"}
          </div>
          <div className="md:col-span-1 text-right">
            <span className={`text-xs uppercase tracking-widest ${STATUS_COLORS[status] || "text-[#6B7280]"}`}>
              {status}
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-5 lg:px-6 pb-6 pl-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="overline mb-3">Contact</div>
              <ul className="space-y-1.5 text-sm text-[#3A4759]">
                <li className="flex items-center gap-2"><Mail size={14} className="text-[#6B7280]" /><span>{app.contact_email}</span></li>
                <li className="flex items-center gap-2"><Phone size={14} className="text-[#6B7280]" /><span>{app.contact_phone || "—"}</span></li>
                <li className="flex items-center gap-2"><Globe2 size={14} className="text-[#6B7280]" /><span>{app.website || "no website"}</span></li>
              </ul>
            </div>
            <div>
              <div className="overline mb-3">Compliance &amp; capacity</div>
              <ul className="space-y-1.5 text-sm text-[#3A4759]">
                <li><span className="text-[#6B7280]">IEC:</span> {app.iec_number || <span className="text-[#6B7280]">—</span>}</li>
                <li><span className="text-[#6B7280]">GSTIN:</span> {app.gst_number || <span className="text-[#6B7280]">—</span>}</li>
                <li><span className="text-[#6B7280]">Experience:</span> {app.export_experience || "—"}</li>
                <li><span className="text-[#6B7280]">Factory size / employees:</span> {app.factory_size || "—"} / {app.employee_count || "—"}</li>
              </ul>
            </div>
          </div>

          {(app.product_categories || []).length > 0 && (
            <div className="mt-6">
              <div className="overline mb-3">Categories</div>
              <div className="flex flex-wrap gap-2">
                {app.product_categories.map((c) => (
                  <span key={c} className="text-xs px-3 py-1 border hairline text-[#012D76] bg-[#F5F9FC]">{c}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="overline mb-3">Uploaded documents</div>
            {docs.length === 0 ? (
              <div className="text-sm text-[#6B7280] italic">No documents uploaded</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {docs.map((d, i) => (
                  <DocumentRow key={d.file_id || d.path || i} doc={d} />
                ))}
              </div>
            )}
          </div>

          {app.notes && (
            <div className="mt-6">
              <div className="overline mb-2">Applicant notes</div>
              <p className="text-sm text-[#3A4759] whitespace-pre-line bg-[#F5F9FC] border hairline p-4">{app.notes}</p>
            </div>
          )}

          <div className="mt-6 text-xs text-[#6B7280]">
            Submitted {new Date(app.created_at).toLocaleString()} · application_id <span className="font-mono">{app.application_id}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BuyerIntakeRow({ intake }) {
  return (
    <div className="p-5 border-b hairline last:border-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center" data-testid={`admin-intake-${intake.intake_id}`}>
      <div className="md:col-span-3">
        <div className="font-display text-base text-[#012D76]">{intake.company_name}</div>
        <div className="text-xs text-[#6B7280] mt-1">{intake.contact_name} · {intake.country}</div>
      </div>
      <div className="md:col-span-2 text-sm text-[#3A4759]">{intake.product_category}</div>
      <div className="md:col-span-2 text-sm text-[#3A4759]">{intake.annual_volume}</div>
      <div className="md:col-span-2 text-sm text-[#3A4759]">{intake.timeline}</div>
      <div className="md:col-span-2 text-xs text-[#6B7280]">{intake.contact_email}</div>
      <div className="md:col-span-1 text-right">
        <span className={`text-xs uppercase tracking-widest ${STATUS_COLORS[intake.status] || "text-[#6B7280]"}`}>
          {intake.status}
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("suppliers");
  const [apps, setApps] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.allSettled([
      api.get("/supplier/applications"),
      api.get("/buyer/intakes"),
    ]).then(([appsRes, intakesRes]) => {
      if (appsRes.status === "fulfilled") setApps(appsRes.value.data);
      if (intakesRes.status === "fulfilled") setIntakes(intakesRes.value.data);
      setLoading(false);
    });
  }, []);

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) =>
      [a.company_name, a.contact_name, a.contact_email, a.country, a.iec_number, a.gst_number]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [apps, query]);

  const filteredIntakes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return intakes;
    return intakes.filter((i) =>
      [i.company_name, i.contact_name, i.contact_email, i.country, i.product_category]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [intakes, query]);

  const totalDocs = useMemo(
    () => apps.reduce((sum, a) => sum + (a.documents?.length || 0), 0),
    [apps]
  );

  return (
    <PortalShell testid="admin-dashboard-shell">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16" data-testid="admin-dashboard">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
        <div>
          <div className="overline mb-2">Admin console</div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light">
            EEC Operations · {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-[#3A4759] mt-2">All buyer briefs and supplier applications across the network.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, email, country…"
            className="w-full pl-9 pr-3 py-3 bg-[#FFFFFF] border hairline text-sm text-[#012D76] focus:outline-none focus:border-[#012D76]/40"
            data-testid="admin-search"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Factory} label="Suppliers" value={apps.length} />
        <StatCard icon={FileText} label="Documents" value={totalDocs} />
        <StatCard icon={Users} label="Buyer briefs" value={intakes.length} />
        <StatCard icon={ClipboardCheck} label="Pending review"
          value={apps.filter((a) => a.status === "pending_review").length} />
      </div>

      <div className="flex items-center gap-1 border-b hairline mb-0">
        {[
          { id: "suppliers", label: `Supplier applications (${apps.length})` },
          { id: "buyers", label: `Buyer intakes (${intakes.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`admin-tab-${t.id}`}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#012D76] text-[#012D76]"
                : "border-transparent text-[#6B7280] hover:text-[#012D76]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="border-x border-b hairline bg-surface">
        {loading ? (
          <div className="p-10 text-[#6B7280] text-sm">Loading…</div>
        ) : tab === "suppliers" ? (
          filteredApps.length === 0 ? (
            <div className="p-10 text-center text-[#6B7280] text-sm">No supplier applications {query && "match your search"}</div>
          ) : (
            <div data-testid="admin-suppliers-list">
              {filteredApps.map((a, i) => (
                <SupplierApplicationRow key={a.application_id} app={a} defaultOpen={i === 0} />
              ))}
            </div>
          )
        ) : filteredIntakes.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280] text-sm">No buyer intakes {query && "match your search"}</div>
        ) : (
          <div data-testid="admin-buyers-list">
            {filteredIntakes.map((it) => (
              <BuyerIntakeRow key={it.intake_id} intake={it} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 text-xs text-[#6B7280] flex items-center gap-2">
        <Building2 size={12} />
        Admin can view documents from any supplier — files stream from S3 via 1-hour presigned URLs.
      </div>
    </div>
    </PortalShell>
  );
}
