import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import NewBadge from "@/components/NewBadge";

const BUYER_ITEMS = [
  {
    title: "Supplier Background Check",
    desc: "Research and assess essential company information before proceeding with a potential supplier.",
  },
  {
    title: "India Sourcing Feasibility Snapshot",
    desc: "Understand the opportunities, potential challenges and feasibility of sourcing your product from India.",
  },
  {
    title: "Custom Sourcing & Procurement Support",
    desc: "Need supplier identification, quotations, supplier evaluation or ongoing sourcing assistance? EEC can propose a solution based on your specific requirements.",
  },
];

const SUPPLIER_ITEMS = [
  {
    title: "Complimentary Export Readiness Diagnostic — Limited Pilot",
    desc: "Discover how prepared your company is to meet international buyer requirements, identify critical gaps and understand what improvements to prioritise.",
    note: "Available to the first 10 qualified manufacturers and exporters accepted into EEC's pilot programme.",
  },
  {
    title: "Export Compliance & Growth Support",
    desc: "EEC also offers tailored advisory services to help businesses address export-readiness gaps, destination-market compliance requirements and international buyer preparedness.",
    note: "Contact us for a customised proposal.",
  },
];

// Each column sits on a softly faded photo (same treatment as the For Buyers hero) so the
// block feels alive without hurting readability.
function ServiceColumn({ label, items, image, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#FDF8EE] via-[#FDF8EE]/90 to-[#FDF8EE]/80"
        aria-hidden="true"
      />
      <div className="relative p-6 lg:p-8">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A6F2B] font-semibold mb-5">{label}</div>
        <div className="space-y-5">
          {items.map(({ title, desc, note }) => (
            <div key={title}>
              <h3 className="font-display text-lg lg:text-xl text-[#012D76] leading-snug">{title}</h3>
              <p className="mt-1.5 text-sm text-[#3A4759] leading-relaxed">{desc}</p>
              {note && <p className="mt-1.5 text-sm text-[#012D76] font-medium leading-relaxed">{note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// First block of the homepage hero: the new services, framed in the shared "new service" theme.
export default function HomeServices() {
  return (
    <div id="our-services" className="mb-12 scroll-mt-28 lg:mb-16" data-testid="services-section">
      <div className="eec-new-card overflow-hidden shadow-[0_24px_60px_-30px_rgba(1,45,118,0.45)]">
        <div className="eec-announce flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 text-white lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <NewBadge className="eec-new-pulse" />
            <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
              Sourcing &amp; Export Support Services are here
            </h2>
          </div>
          <p className="text-sm text-white/80">Background Check · Feasibility Snapshot · Export Diagnostic</p>
        </div>

        <div className="px-6 pt-6 lg:px-8 lg:pt-8">
          <p className="font-display text-xl italic text-[#8A6F2B] lg:text-2xl">
            Smarter Sourcing for Buyers. Stronger Export Capabilities for Suppliers.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3A4759] lg:text-base">
            EEC offers practical, AI-enabled consultancy services to help international buyers make informed sourcing
            decisions and manufacturers prepare for international markets.
          </p>
        </div>

        <div className="mt-2 grid md:grid-cols-2">
          <ServiceColumn label="For International Buyers" items={BUYER_ITEMS} image="/images/hero-about-buyers.jpg" />
          <ServiceColumn
            label="For Manufacturers & Exporters"
            items={SUPPLIER_ITEMS}
            image="/images/hero-suppliers.jpg"
            className="border-t border-[#C9A23F]/40 md:border-l md:border-t-0"
          />
        </div>

        <div className="flex flex-wrap gap-4 border-t border-[#C9A23F]/40 px-6 py-5 lg:px-8">
          <Link href="/for-buyers#buyer-services" className="eec-btn-primary" data-testid="services-cta-buyers">
            Explore Buyer Services <ArrowUpRight size={16} />
          </Link>
          <Link href="/for-suppliers#export-readiness" className="eec-btn-secondary" data-testid="services-cta-suppliers">
            Explore Supplier Services <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
