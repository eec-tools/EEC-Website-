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
    title: "Complimentary Export Readiness Diagnostic (Limited Pilot)",
    desc: "Discover how prepared your company is to meet international buyer requirements, identify critical gaps and understand what improvements to prioritise.",
    note: "Available to the first 10 qualified manufacturers and exporters accepted into EEC's pilot programme.",
  },
  {
    title: "Export Compliance & Growth Support",
    desc: "EEC also offers tailored advisory services to help businesses address export-readiness gaps, destination-market compliance requirements and international buyer preparedness.",
    note: "Contact us for a customised proposal.",
  },
];

// Blue for international buyers, teal for manufacturers & exporters (same as .eec-buyer-card / .eec-supplier-card).
const THEMES = {
  buyer: {
    band: "bg-[#1B4A99]",
    tint: "from-[#F2F6FC] via-[#F2F6FC]/92 to-[#F2F6FC]/85",
    title: "text-[#012D76]",
    note: "text-[#1B4A99]",
    button: "eec-btn-primary",
  },
  supplier: {
    band: "bg-[#0F766E]",
    tint: "from-[#EFF8F6] via-[#EFF8F6]/92 to-[#EFF8F6]/85",
    title: "text-[#0B4F4A]",
    note: "text-[#0F766E]",
    button: "eec-btn-supplier",
  },
};

// One audience column: a bold coloured header so buyers and suppliers can spot their side at a glance,
// the services for that audience on a softly faded photo, and the matching button underneath.
function ServiceColumn({ audience, heading, subheading, items, image, cta, className = "" }) {
  const t = THEMES[audience];
  return (
    <div className={`relative flex flex-col overflow-hidden ${className}`} data-testid={`home-services-${audience}`}>
      <div className={`${t.band} px-6 py-5 text-white lg:px-8 lg:py-6`}>
        <h3 className="font-display text-2xl font-medium tracking-tight lg:text-3xl">{heading}</h3>
        <p className="mt-1 text-sm text-white/85">{subheading}</p>
      </div>
      <div className="relative flex flex-1 flex-col">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
        <div className={`absolute inset-0 bg-gradient-to-b ${t.tint}`} aria-hidden="true" />
        <div className="relative flex flex-1 flex-col p-6 lg:p-8">
          <div className="space-y-5">
            {items.map(({ title, desc, note }) => (
              <div key={title}>
                <h4 className={`font-display text-lg leading-snug lg:text-xl ${t.title}`}>{title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[#3A4759]">{desc}</p>
                {note && <p className={`mt-1.5 text-sm font-medium leading-relaxed ${t.note}`}>{note}</p>}
              </div>
            ))}
          </div>
          <div className="mt-auto pt-7">
            <Link href={cta.href} className={t.button} data-testid={cta.testid}>
              {cta.label} <ArrowUpRight size={16} />
            </Link>
          </div>
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
            EEC helps international buyers identify, evaluate, and select reliable manufacturing partners while supporting manufacturers in improving their export readiness, meeting buyer expectations, and accessing new international business opportunities.
          </p>
        </div>

        <div className="mt-6 grid md:grid-cols-2">
          <ServiceColumn
            audience="buyer"
            heading="For International Buyers"
            subheading="Find and check suppliers in India before you commit."
            items={BUYER_ITEMS}
            image="/images/hero-about-buyers.jpg"
            cta={{ label: "Explore Buyer Services", href: "/for-buyers#buyer-services", testid: "services-cta-buyers" }}
          />
          <ServiceColumn
            audience="supplier"
            heading="For Manufacturers & Exporters"
            subheading="Get ready to win international buyers."
            items={SUPPLIER_ITEMS}
            image="/images/hero-suppliers.jpg"
            className="border-t-4 border-white md:border-l-4 md:border-t-0"
            cta={{ label: "Explore Supplier Services", href: "/for-suppliers#export-readiness", testid: "services-cta-suppliers" }}
          />
        </div>
      </div>
    </div>
  );
}
