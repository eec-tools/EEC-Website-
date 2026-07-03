import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ClipboardCheck, ShieldCheck, FileText, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import DocumentRow from "@/components/DocumentRow";
import PortalShell from "@/components/PortalShell";

export default function SupplierPortal() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/supplier/applications")
      .then(({ data }) => setApps(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalShell testid="supplier-portal-shell">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16" data-testid="supplier-portal">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
        <div>
          <div className="overline mb-2">Supplier portal</div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light">
            Hello, {user?.name?.split(" ")[0] || "Supplier"}.
          </h1>
          <p className="text-[#3A4759] mt-2">Your factory profile and applications.</p>
        </div>
        <Link to="/supplier/apply" className="eec-btn-primary self-start" data-testid="supplier-portal-new-app">
          {apps.length ? "Submit another application" : "Start application"} <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: Building2, label: "Applications", value: apps.length },
          { icon: FileText, label: "Documents", value: apps.reduce((acc, a) => acc + (a.documents?.length || 0), 0) },
          { icon: ClipboardCheck, label: "Categories", value: new Set(apps.flatMap((a) => a.product_categories || [])).size },
          { icon: ShieldCheck, label: "Status", value: apps[0]?.status || "Not started" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="border hairline bg-surface p-6">
            <Icon size={18} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" />
            <div className="font-display text-2xl text-[#012D76] mt-4">{value}</div>
            <div className="text-xs text-[#6B7280] mt-2 tracking-widest uppercase">{label}</div>
          </div>
        ))}
      </div>

      <div className="border hairline bg-surface">
        <div className="px-6 py-4 border-b hairline overline">Applications</div>
        {loading ? (
          <div className="p-10 text-[#6B7280] text-sm">Loading…</div>
        ) : apps.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[#3A4759] mb-4">No applications yet. Submit your factory profile to get qualified.</p>
            <Link to="/supplier/apply" className="eec-btn-primary" data-testid="supplier-portal-empty-cta">
              Apply now <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E5EBF2]">
            {apps.map((a) => {
              const docs = a.documents || [];
              return (
                <div key={a.application_id} className="p-6" data-testid={`app-row-${a.application_id}`}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                      <div className="font-display text-lg text-[#012D76]">{a.company_name}</div>
                      <div className="text-xs text-[#6B7280] mt-1">{a.country}{a.state ? ` · ${a.state}` : ""}</div>
                    </div>
                    <div className="md:col-span-3 text-sm text-[#3A4759]">
                      {(a.product_categories || []).slice(0, 2).join(", ")}
                    </div>
                    <div className="md:col-span-2 text-sm text-[#3A4759]">{a.annual_capacity}</div>
                    <div className="md:col-span-2 text-sm text-[#3A4759]">{docs.length} docs</div>
                    <div className="md:col-span-1 text-right">
                      <span className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] text-xs uppercase tracking-widest">{a.status}</span>
                    </div>
                  </div>

                  {docs.length > 0 && (
                    <div className="mt-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-[#6B7280] mb-3">
                        Uploaded documents
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {docs.map((d, i) => (
                          <DocumentRow key={d.file_id || d.path || i} doc={d} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </PortalShell>
  );
}
