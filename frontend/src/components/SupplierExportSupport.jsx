import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8A6F2B]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BlockHeading({ children }) {
  return <div className="text-xs uppercase tracking-[0.14em] text-[#012D76] font-semibold mb-3">{children}</div>;
}

// Kept visually apart from the supplier network application: this is a separate service
// with its own application path (not /register?role=supplier).
export default function SupplierExportSupport() {
  return (
    <section id="export-readiness" className="py-20 lg:py-24 border-y-4 border-[#C9A23F]/50 bg-[#FDF8EE]/60 scroll-mt-32" data-testid="export-readiness">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="overline mb-3">EEC Export Support</div>
        <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl">
          EEC Export Readiness Diagnostic
        </h2>
        <p className="mt-4 font-display text-xl lg:text-2xl text-[#8A6F2B] italic max-w-3xl">
          How ready is your company to win international business?
        </p>
        <p className="mt-5 max-w-3xl text-[#3A4759] leading-relaxed">
          EEC is inviting manufacturers and exporters to participate in its new Export Readiness Diagnostic Pilot.
        </p>
        <p className="mt-3 max-w-3xl text-[#012D76] font-semibold">
          Complimentary for the first 10 qualified companies accepted into the pilot.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border hairline bg-white p-7 lg:p-9">
            <BlockHeading>What EEC will assess</BlockHeading>
            <CheckList items={SUPPLIER_ASSESSMENT_AREAS} />
          </div>
          <div className="border hairline bg-white p-7 lg:p-9">
            <BlockHeading>What participating companies receive</BlockHeading>
            <CheckList items={SUPPLIER_DELIVERABLES} />
          </div>
        </div>

        <div className="mt-6 border hairline bg-white p-7 lg:p-9">
          <BlockHeading>Pilot Terms</BlockHeading>
          <CheckList items={SUPPLIER_PILOT_TERMS} />
          <Link href={SUPPLIER_DIAGNOSTIC_CTA.href} className="eec-btn-primary mt-8" data-testid="export-diagnostic-cta">
            {SUPPLIER_DIAGNOSTIC_CTA.label} <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-6 border hairline bg-[#012D76] text-white p-7 lg:p-9">
          <h3 className="font-display text-2xl lg:text-3xl">Need More Comprehensive Export Support?</h3>
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
