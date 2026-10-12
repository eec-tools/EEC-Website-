import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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

function ServiceColumn({ label, items }) {
  return (
    <div className="bg-[#FFFFFF] p-7 lg:p-9">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A6F2B] font-semibold mb-6">{label}</div>
      <div className="space-y-7">
        {items.map(({ title, desc, note }) => (
          <div key={title}>
            <h3 className="font-display text-xl lg:text-2xl text-[#012D76]">{title}</h3>
            <p className="mt-2 text-sm text-[#3A4759] leading-relaxed">{desc}</p>
            {note && <p className="mt-2 text-sm text-[#012D76] font-medium leading-relaxed">{note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeServices() {
  return (
    <section id="our-services" className="py-20 lg:py-28 border-t hairline bg-surface" data-testid="services-section">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <span className="overline">Our Services</span>
        <h2 className="font-display text-4xl lg:text-5xl text-[#012D76] mt-5 max-w-3xl tracking-tight">
          EEC&apos;s New Sourcing &amp; Export Support Services
        </h2>
        <p className="mt-4 font-display text-xl lg:text-2xl text-[#8A6F2B] italic max-w-3xl">
          Smarter Sourcing for Buyers. Stronger Export Capabilities for Suppliers.
        </p>
        <p className="mt-5 max-w-3xl text-[#3A4759] leading-relaxed">
          EEC offers practical, AI-enabled consultancy services to help international buyers make informed sourcing
          decisions and manufacturers prepare for international markets.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-px bg-[#E5EBF2] border hairline">
          <ServiceColumn label="For International Buyers" items={BUYER_ITEMS} />
          <ServiceColumn label="For Manufacturers & Exporters" items={SUPPLIER_ITEMS} />
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/for-buyers#buyer-services" className="eec-btn-primary" data-testid="services-cta-buyers">
            Explore Buyer Services <ArrowUpRight size={16} />
          </Link>
          <Link href="/for-suppliers#export-readiness" className="eec-btn-secondary" data-testid="services-cta-suppliers">
            Explore Supplier Services <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
