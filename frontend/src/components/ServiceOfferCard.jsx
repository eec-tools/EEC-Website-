import React from "react";
import Link from "next/link";
import { ArrowUpRight, Gauge, Globe } from "lucide-react";
import NewBadge from "@/components/NewBadge";
import { SUPPLIER_DIAGNOSTIC_CTA, SUPPLIER_PAID_CTA } from "@/constants/services";

const THEMES = {
  buyer: { card: "eec-buyer-card", icon: "text-[#1B4A99]", title: "text-[#012D76]", chip: "border-[#1B4A99]/30", button: "eec-btn-primary", link: "text-[#1B4A99]" },
  supplier: { card: "eec-supplier-card", icon: "text-[#0F766E]", title: "text-[#0B4F4A]", chip: "border-[#0F766E]/30", button: "eec-btn-supplier", link: "text-[#0F766E]" },
};

// The two services for manufacturers & exporters. Shown on both the Services page and the
// For Suppliers page so the offer reads the same everywhere. Export Readiness comes first.
export const SUPPLIER_SERVICE_CARDS = [
  {
    id: "export-diagnostic",
    icon: Gauge,
    title: "Export Readiness Diagnostic",
    badge: "Complimentary pilot",
    desc: "Discover how prepared your company is to meet international buyer requirements, identify critical gaps and understand what to improve first. Receive an EEC Export Readiness Score and a practical 90-day action plan.",
    facts: ["First 10 qualified companies", "Desk-based assessment"],
    cta: SUPPLIER_DIAGNOSTIC_CTA.label,
    href: SUPPLIER_DIAGNOSTIC_CTA.href,
    detailHref: "/for-suppliers#export-diagnostic-details",
  },
  {
    id: "export-support",
    icon: Globe,
    title: "Export Compliance & Growth Support",
    desc: "Tailored advisory to help you address export-readiness gaps, destination-market compliance requirements and international buyer preparedness.",
    facts: ["Customised proposal", "Per business and market"],
    cta: SUPPLIER_PAID_CTA.label,
    href: SUPPLIER_PAID_CTA.href,
    detailHref: "/for-suppliers#export-support-details",
  },
];

export function OfferCard({ audience = "buyer", id, icon: Icon, title, badge, desc, facts, cta, href, detailHref }) {
  const t = THEMES[audience];
  return (
    <article className={`${t.card} eec-card-lift group flex flex-col p-7 lg:p-8`} data-testid={`services-offer-${id}`}>
      <div className="flex items-start justify-between gap-4">
        <Icon size={28} className={t.icon} aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <NewBadge />
          {badge && (
            <span className={`border ${t.chip} bg-white text-[#012D76] text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-0.5`}>{badge}</span>
          )}
        </div>
      </div>
      <h3 className={`font-display text-2xl mt-6 mb-3 ${t.title}`}>{title}</h3>
      <p className="text-sm text-[#3A4759] leading-relaxed">{desc}</p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {facts.map((f) => (
          <li key={f} className={`border ${t.chip} bg-white px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#012D76]`}>{f}</li>
        ))}
      </ul>
      <div className="mt-auto pt-8 flex flex-col items-start gap-4">
        <Link href={href} className={t.button} data-testid={`services-offer-cta-${id}`}>
          {cta} <ArrowUpRight size={16} />
        </Link>
        {detailHref && (
          <Link href={detailHref} className={`text-sm hover:underline ${t.link}`}>See full details</Link>
        )}
      </div>
    </article>
  );
}

export function SupplierServiceCards({ detailHrefs = {} }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl" data-testid="supplier-service-cards">
      {SUPPLIER_SERVICE_CARDS.map((c) => (
        <OfferCard key={c.id} audience="supplier" {...c} detailHref={detailHrefs[c.id] ?? c.detailHref} />
      ))}
    </div>
  );
}
