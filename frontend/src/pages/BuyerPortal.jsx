import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Inbox, FileBarChart, Layers, Globe2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import PortalShell from "@/components/PortalShell";
import Seo from "@/components/Seo";

export default function BuyerPortal() {
  const { user } = useAuth();
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/buyer/intakes")
      .then(({ data }) => setIntakes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalShell testid="buyer-portal-shell">
    <Seo title="Buyer Portal | Elan Exports Consultancy" description="Your briefs and sourcing activity." robots="noindex" />
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16" data-testid="buyer-portal">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
        <div>
          <div className="overline mb-2">Buyer portal</div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light">
            Hello, {user?.name?.split(" ")[0] || "Buyer"}.
          </h1>
          <p className="text-[#3A4759] mt-2">Your sourcing briefs and program activity.</p>
        </div>
        <Link to="/buyer/intake" className="eec-btn-primary self-start" data-testid="buyer-portal-new-brief">
          New sourcing brief <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: Inbox, label: "Briefs submitted", value: intakes.length },
          { icon: Layers, label: "Active categories", value: new Set(intakes.map((i) => i.product_category)).size },
          { icon: Globe2, label: "Countries", value: new Set(intakes.map((i) => i.country)).size },
          { icon: FileBarChart, label: "Status", value: intakes.length ? "Live" : "Idle" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="border hairline bg-surface p-6">
            <Icon size={18} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" />
            <div className="font-display text-3xl text-[#012D76] mt-4">{value}</div>
            <div className="text-xs text-[#6B7280] mt-2 tracking-widest uppercase">{label}</div>
          </div>
        ))}
      </div>

      <div className="border hairline bg-surface">
        <div className="px-6 py-4 border-b hairline flex items-center justify-between">
          <div className="overline">Your briefs</div>
          <span className="text-xs text-[#6B7280]">{intakes.length} total</span>
        </div>
        {loading ? (
          <div className="p-10 text-[#6B7280] text-sm">Loading…</div>
        ) : intakes.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[#3A4759] mb-4">No sourcing briefs submitted yet.</p>
            <Link to="/buyer/intake" className="eec-btn-primary" data-testid="buyer-portal-empty-cta">
              Submit your first brief <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-[#6B7280] border-b hairline">
                  <th className="text-left p-4">Company</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Country</th>
                  <th className="text-left p-4">Volume</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {intakes.map((it) => (
                  <tr key={it.intake_id} className="border-b hairline last:border-0">
                    <td className="p-4 text-[#012D76]">{it.company_name}</td>
                    <td className="p-4 text-[#3A4759]">{it.product_category}</td>
                    <td className="p-4 text-[#3A4759]">{it.country}</td>
                    <td className="p-4 text-[#3A4759]">{it.annual_volume}</td>
                    <td className="p-4"><span className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] text-xs uppercase tracking-widest">{it.status}</span></td>
                    <td className="p-4 text-[#6B7280]">{new Date(it.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PortalShell>
  );
}
