import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import NewBadge from "@/components/NewBadge";
import AudienceTag from "@/components/AudienceTag";
import { SupplierServiceCards } from "@/components/ServiceOfferCard";
import {
  SUPPLIER_ASSESSMENT_AREAS,
  SUPPLIER_DELIVERABLES,
  SUPPLIER_PILOT_TERMS,
  SUPPLIER_DIAGNOSTIC_CTA,
  SUPPLIER_PAID_CTA,
} from "@/constants/services";

function CheckList({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm text-[#3A4759] leading-relaxed">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#0F766E]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BlockHeading({ children }) {
  return <div className="text-xs uppercase tracking-[0.14em] text-[#0B4F4A] font-semibold mb-3">{children}</div>;
}

// Export support for manufacturers & exporters: the same two service cards as the Services page,
// followed by the full details of each. Kept separate from the supplier network application,
// which has its own path (/register?role=supplier).
export default function SupplierExportSupport() {
  return (
    <section
      id="export-readiness"
      className="py-20 lg:py-24 border-y-4 border-[#0F766E] bg-[#F7FBFA] scroll-mt-32"
      data-testid="export-readiness"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <AudienceTag audience="supplier" />
          <NewBadge />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-[#0B4F4A] tracking-tight font-light max-w-3xl">
          Export Support Services
        </h2>
        <p className="mt-4 max-w-3xl text-[#3A4759] leading-relaxed mb-10">
          Two services to help you understand your gaps and prepare for international buyers. Both are separate from the EEC supplier network application.
        </p>

        <SupplierServiceCards
          detailHrefs={{
            "export-diagnostic": "#export-diagnostic-details",
            "export-support": "#export-support-details",
          }}
        />

        <div id="export-diagnostic-details" className="mt-16 scroll-mt-32" data-testid="export-diagnostic-details">
          <h3 className="font-display text-2xl sm:text-3xl text-[#0B4F4A] tracking-tight">EEC Export Readiness Diagnostic</h3>
          <p className="mt-3 font-display text-xl lg:text-2xl text-[#0F766E] italic max-w-3xl">
            How ready is your company to win international business?
          </p>
          <p className="mt-4 max-w-3xl text-[#3A4759] leading-relaxed">
            EEC is inviting manufacturers and exporters to participate in its new Export Readiness Diagnostic Pilot.
          </p>
          <p className="mt-3 max-w-3xl text-[#0B4F4A] font-semibold">
            Complimentary for the first 10 qualified companies accepted into the pilot.
          </p>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="eec-supplier-card p-7 lg:p-9">
              <BlockHeading>What EEC will assess</BlockHeading>
              <CheckList items={SUPPLIER_ASSESSMENT_AREAS} />
            </div>
            <div className="eec-supplier-card p-7 lg:p-9">
              <BlockHeading>What participating companies receive</BlockHeading>
              <CheckList items={SUPPLIER_DELIVERABLES} />
            </div>
          </div>

          <div className="eec-supplier-card mt-6 p-7 lg:p-9">
            <BlockHeading>Pilot Terms</BlockHeading>
            <CheckList items={SUPPLIER_PILOT_TERMS} />
            <Link href={SUPPLIER_DIAGNOSTIC_CTA.href} className="eec-btn-supplier mt-8" data-testid="export-diagnostic-cta">
              {SUPPLIER_DIAGNOSTIC_CTA.label} <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div
          id="export-support-details"
          className="mt-10 bg-[#0F766E] text-white p-7 lg:p-9 scroll-mt-32"
          data-testid="export-support-details"
        >
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/80 font-semibold">Export Compliance &amp; Growth Support</div>
          <h3 className="font-display text-2xl lg:text-3xl mt-2">Need More Comprehensive Export Support?</h3>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/90">
            EEC also offers paid export-readiness assessments, destination-country compliance research, improvement
            planning and ongoing export support.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/90">
            Services and fees are proposed according to your business, product, destination market and requirements.
          </p>
          <Link href={SUPPLIER_PAID_CTA.href} className="eec-btn-accent mt-8" data-testid="export-paid-cta">
            {SUPPLIER_PAID_CTA.label} <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
