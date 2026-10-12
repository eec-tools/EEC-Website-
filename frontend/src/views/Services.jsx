"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Search, ClipboardCheck, FileBarChart, Anchor, ShieldCheck, Compass, Handshake, Gauge, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ENGAGEMENT_TIERS } from "@/constants/engagementTiers";
import {
  BUYER_OFFERS,
  CUSTOM_SOURCING_OFFER,
  SUPPLIER_DIAGNOSTIC_CTA,
  SUPPLIER_PAID_CTA,
} from "@/constants/services";

const OFFER_ICONS = {
  "background-check": ShieldCheck,
  "feasibility-snapshot": Compass,
};

const BUYER_CARDS = [
  ...BUYER_OFFERS.map((o) => ({
    id: o.id,
    icon: OFFER_ICONS[o.id],
    title: o.title,
    desc: o.intro,
    facts: o.facts,
    cta: o.cta,
    href: o.href,
  })),
  {
    id: CUSTOM_SOURCING_OFFER.id,
    icon: Handshake,
    title: CUSTOM_SOURCING_OFFER.title,
    desc: "Supplier identification, RFQ coordination, quotation comparison, sourcing strategy and ongoing sourcing assistance, scoped to your requirements.",
    facts: ["Scoped individually", "Project or ongoing"],
    cta: CUSTOM_SOURCING_OFFER.cta,
    href: CUSTOM_SOURCING_OFFER.href,
  },
];

const SUPPLIER_CARDS = [
  {
    id: "export-diagnostic",
    icon: Gauge,
    title: "Export Readiness Diagnostic",
    badge: "Complimentary pilot",
    desc: "Discover how prepared your company is to meet international buyer requirements, identify critical gaps and understand what to improve first. Receive an EEC Export Readiness Score and a practical 90-day action plan.",
    facts: ["First 10 qualified companies", "Desk-based assessment"],
    cta: SUPPLIER_DIAGNOSTIC_CTA.label,
    href: SUPPLIER_DIAGNOSTIC_CTA.href,
    detailHref: "/for-suppliers#export-readiness",
  },
  {
    id: "export-support",
    icon: Globe,
    title: "Export Compliance & Growth Support",
    desc: "Tailored advisory to help you address export-readiness gaps, destination-market compliance requirements and international buyer preparedness.",
    facts: ["Customised proposal", "Per business and market"],
    cta: SUPPLIER_PAID_CTA.label,
    href: SUPPLIER_PAID_CTA.href,
    detailHref: "/for-suppliers#export-readiness",
  },
];

const HOW_IT_WORKS = [
  { n: "01", t: "Submit your request", d: "Choose a service and tell us about your supplier, product or company. It takes a few minutes." },
  { n: "02", t: "EEC reviews and confirms", d: "We check the details, ask for anything missing and confirm the assignment and scope with you." },
  { n: "03", t: "We do the research", d: "Fixed-fee services begin once payment instructions are settled and complete information is received." },
  { n: "04", t: "Receive your report", d: "You get a clear written output with recommendations, within the target delivery time of your service." },
];

const SERVICES = [
  {
    icon: Search,
    t: "Supplier Identification and Qualification",
    d: "We identify and evaluate manufacturers that align with your product specifications, quality requirements, production capabilities and commercial objectives, helping you build a trusted supplier base.",
  },
  {
    icon: ClipboardCheck,
    t: "Supplier Verification and Assessment",
    d: "Our team supports supplier verification through capability assessments, documentation reviews and compliance evaluations, providing buyers with greater confidence during supplier selection.",
  },
  {
    icon: FileBarChart,
    t: "Procurement Support",
    d: "EEC supports procurement activities including supplier coordination, commercial discussions, sourcing strategy and communication throughout the purchasing process.",
  },
  {
    icon: Anchor,
    t: "Supply Chain Coordination",
    d: "We help coordinate sourcing activities between buyers and suppliers, supporting efficient communication, documentation and project management across international supply chains.",
  },
];

const TIER_DISPLAY = {
  scout: { label: "ONE-TIME ENGAGEMENT", subtitle: "Initial Supplier Discovery" },
  engage: { label: "PER SOURCING PROJECT", subtitle: "End to End Sourcing Support" },
  embed: { label: "QUARTERLY RETAINER", subtitle: "Strategic Procurement Partnership" },
};

const TIERS = ENGAGEMENT_TIERS.map((tier) => ({
  ...tier,
  ...TIER_DISPLAY[tier.id],
}));

const FAQ = [
  { q: "What is the Supplier Background Check?", a: "An independent, desk-based review of one supplier in one country: their stated company identity, available registration information, website and public presence, with potential inconsistencies flagged in a concise written report. It is an initial information review, not a factory audit, financial audit or legal investigation, and it does not guarantee supplier reliability." },
  { q: "What is the India Sourcing Feasibility Snapshot?", a: "A desk-based assessment of whether and how a single defined product can be sourced from India for one destination country. It covers the supply market, key specifications, common challenges such as MOQ, quality and certification, and recommended next steps. It does not include supplier introductions, confirmed quotations, supplier audits or guaranteed pricing." },
  { q: "Is the Export Readiness Diagnostic really free?", a: "Yes. It is complimentary for the first 10 qualified manufacturers and exporters accepted into EEC's pilot, subject to an eligibility review. Acceptance is not guaranteed, and there is no obligation to purchase any follow-on service." },
  { q: "What happens after I submit a request?", a: "EEC reviews your request, asks for any missing information and confirms the assignment and scope with you. For fixed-fee Buyer Services, payment instructions are issued after confirmation, and delivery timelines start once payment and all required information are received." },
  { q: "Which engagement option is right for me?", a: "EEC offers flexible sourcing services designed to meet different business needs. Whether you require supplier discovery, support for a specific sourcing project or ongoing procurement assistance, our team will recommend an engagement approach based on your sourcing objectives." },
  { q: "How long does a sourcing project take?", a: "Project timelines vary depending on product complexity, supplier availability, technical requirements and buyer specifications. Our team works closely with clients to establish realistic timelines and provide regular updates throughout the sourcing process." },
  { q: "Does EEC support freight and logistics?", a: "EEC can assist with procurement coordination and facilitate communication with logistics and supply chain partners where required. The level of support depends on the scope of the sourcing engagement." },
  { q: "Can EEC source multiple product categories?", a: "Yes. EEC supports sourcing across multiple industries and product categories, helping businesses manage sourcing projects with verified manufacturers across different regions and markets." },
  { q: "Can I expand my engagement as my sourcing needs grow?", a: "Yes. Many clients begin with a focused sourcing requirement and expand into broader procurement support as their business grows. Our services are designed to scale alongside your sourcing requirements." },
  { q: "Does EEC coordinate supplier verification?", a: "Yes. Where a sourcing engagement calls for it, EEC manages the verification workflow directly, coordinating capability assessments, documentation review and inspection scheduling with recognised third-party partners, and routing the resulting reports back to you as part of the project deliverables." },
];

function OfferCard({ id, icon: Icon, title, badge, desc, facts, cta, href, detailHref }) {
  return (
    <article
      className="group flex flex-col border hairline bg-white p-7 lg:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A23F] hover:shadow-[0_18px_40px_-20px_rgba(1,45,118,0.35)]"
      data-testid={`services-offer-${id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <Icon size={28} className="text-[#8A6F2B]" aria-hidden="true" />
        {badge && (
          <span className="bg-[#C9A23F] text-black text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1">{badge}</span>
        )}
      </div>
      <h3 className="font-display text-2xl text-[#012D76] mt-6 mb-3">{title}</h3>
      <p className="text-sm text-[#3A4759] leading-relaxed">{desc}</p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {facts.map((f) => (
          <li key={f} className="border hairline bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#012D76]">{f}</li>
        ))}
      </ul>
      <div className="mt-auto pt-8 flex flex-col items-start gap-4">
        <Link href={href} className="eec-btn-primary" data-testid={`services-offer-cta-${id}`}>
          {cta} <ArrowUpRight size={16} />
        </Link>
        {detailHref && (
          <Link href={detailHref} className="text-sm text-[#012D76] hover:underline">See full details</Link>
        )}
      </div>
    </article>
  );
}

export default function Services() {
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref =
    isAuthed && user.role === "admin" ? "/admin"
    : isAuthed && user.role === "supplier" ? "/supplier"
    : "/buyer";

  return (
    <div data-testid="services-page">


      <section className="border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
          <div className="overline mb-4">Services</div>
          <h1 className="sr-only">Sourcing and Export Support Services for International Buyers and Manufacturers</h1>
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light text-[#012D76] max-w-4xl" aria-hidden="true">
            Smarter sourcing for buyers. <span className="gold-text">Stronger exports</span> for suppliers.
          </p>
          <p className="mt-6 text-[#3A4759] max-w-2xl text-lg leading-relaxed">
            Practical, AI-enabled consultancy that helps international buyers make informed sourcing decisions and helps manufacturers prepare for international markets.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="#buyer-services" className="eec-btn-primary" data-testid="services-hero-buyers">
              Services for buyers <ArrowUpRight size={16} />
            </Link>
            <Link href="#supplier-services" className="eec-btn-secondary" data-testid="services-hero-suppliers">
              Services for manufacturers &amp; exporters
            </Link>
          </div>
        </div>
      </section>

      <section id="buyer-services" className="py-20 lg:py-24 scroll-mt-20" data-testid="services-buyer-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">For international buyers</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl mb-4">
            Know your supplier and your market before you commit.
          </h2>
          <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-12">
            Two focused, fixed-scope research services, plus tailored support when your sourcing needs go further.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {BUYER_CARDS.map((c) => (
              <OfferCard key={c.id} {...c} detailHref="/for-buyers#buyer-services" />
            ))}
          </div>
          <p className="mt-6 text-sm text-[#3A4759]">
            Fixed-fee services are subject to EEC&apos;s{" "}
            <Link href="/for-buyers#service-terms" className="text-[#012D76] underline hover:no-underline">Service Terms</Link>.
          </p>
        </div>
      </section>

      <section id="supplier-services" className="py-20 lg:py-24 border-t hairline bg-surface scroll-mt-20" data-testid="services-supplier-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">For manufacturers &amp; exporters</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl mb-4">
            Find out how ready you are to win international business.
          </h2>
          <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-12">
            Separate from the EEC supplier network application, these services help you understand your gaps and prepare for international buyers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {SUPPLIER_CARDS.map((c) => (
              <OfferCard key={c.id} {...c} />
            ))}
          </div>
          <p className="mt-6 text-sm text-[#3A4759]">
            Looking to join the EEC supplier network instead?{" "}
            <Link href="/for-suppliers" className="text-[#012D76] underline hover:no-underline">See supplier qualification</Link>.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t hairline bg-[#012D76] text-white grain" data-testid="services-how-it-works">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">How it works</div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight font-light max-w-3xl mb-12">
            From request to report in four simple steps.
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/15">
            {HOW_IT_WORKS.map(({ n, t, d }) => (
              <li key={n} className="bg-[#012D76] p-7">
                <div className="font-display text-4xl text-[#E7C873]">{n}</div>
                <div className="font-display text-xl mt-4 mb-2">{t}</div>
                <p className="text-sm text-white/80 leading-relaxed">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 lg:pt-24">
        <div className="overline mb-3">Full-service sourcing</div>
        <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl">
          Bigger requirements? Our core sourcing capabilities.
        </h2>
      </div>

      <section className="py-12 lg:py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="border hairline p-8 bg-surface flex gap-6">
              <Icon size={28} className="text-[#8A6F2B] mt-1 shrink-0" />
              <div>
                <div className="font-display text-2xl text-[#012D76] mb-2">{t}</div>
                <div className="text-[#3A4759] leading-relaxed">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="engagement-tiers" className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Engagement options</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl mb-4">
            Flexible sourcing support for every stage of your procurement journey.
          </h2>
          <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-12">
            For Custom Sourcing &amp; Procurement Support, EEC offers three engagement models to match different procurement needs. Pricing is scoped and shared at or after the initial discovery call.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((p) => (
              <div key={p.id} className={`relative border ${p.popular ? "border-[#C9A23F]" : "border-[#E5EBF2]"} bg-elevated p-8 flex flex-col`}>
                {p.popular && (
                  <div className="absolute -top-3 left-8 bg-[#C9A23F] text-black text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1">
                    Most chosen
                  </div>
                )}
                <div className="overline mb-2">{p.label}</div>
                <div className="font-display text-3xl text-[#012D76] mb-1">{p.name}</div>
                <div className="text-sm text-[#8A6F2B] font-medium mb-2">{p.subtitle}</div>
                <div className="text-[#3A4759] text-sm mb-6">{p.tagline}</div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#3A4759]">
                      <Check size={16} className="text-[#8A6F2B] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isAuthed ? (
                  <Link href={dashboardHref} className={p.popular ? "eec-btn-primary" : "eec-btn-secondary"} data-testid={`services-pricing-cta-dashboard-${p.id}`}>
                    Go to dashboard <ArrowUpRight size={14} />
                  </Link>
                ) : (
                  <Link href="/buyer/intake" className={p.popular ? "eec-btn-primary" : "eec-btn-secondary"} data-testid={`services-pricing-cta-${p.id}`}>
                    {p.cta} <ArrowUpRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs uppercase tracking-[0.32em] text-[#6B7280]" data-testid="services-pricing-disclaimer">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C9A23F] align-middle mr-3"></span>
            Pricing is tailored to the scope and requirements of each sourcing project. Please contact our team to discuss your sourcing objectives. EEC does not charge suppliers listing or activation fees at any stage.
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C9A23F] align-middle ml-3"></span>
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-8">
            Frequently asked questions about EEC sourcing services
          </h2>
          <div className="border hairline bg-surface overflow-hidden">
            {FAQ.map(({ q, a }, idx) => (
              <div key={q} className={`${idx !== FAQ.length - 1 ? "border-b hairline" : ""} grid grid-cols-1 md:grid-cols-[36%_1fr]`}>
                <div className="p-5 md:p-6 font-medium text-[#012D76]">{q}</div>
                <div className="p-5 md:p-6 text-[#3A4759] leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t hairline bg-surface" data-testid="services-final-cta">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-display text-2xl sm:text-3xl text-[#012D76]">Not sure which service fits?</div>
            <p className="mt-2 text-[#3A4759]">Tell us what you are working on and EEC will recommend the right starting point.</p>
          </div>
          <Link href="/buyer/intake" className="eec-btn-primary shrink-0" data-testid="services-final-cta-link">
            Book a free discovery call <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
