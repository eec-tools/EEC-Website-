"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { COMPANY } from "@/constants/company";
import TeamSection from "@/components/TeamSection";
import AboutMeFounderSection from "@/components/AboutMeFounderSection";
import FaqAccordion from "@/components/FaqAccordion";

const BG = "/images/hero-about-buyers.jpg";

const ABOUT_FAQ = [
  {
    q: "When was Elan Exports Consultancy established?",
    a: `${COMPANY.legalName} was incorporated in Singapore on ${COMPANY.incorporationDateDisplay} (UEN: ${COMPANY.uen}) at ${COMPANY.addressFull}. Since incorporation, EEC has built an active sourcing and supplier network across India and Asia, supporting procurement teams across Europe, the US, the Middle East and Asia-Pacific.`,
  },
  {
    q: "Is EEC a Singapore company?",
    a: `Yes. ${COMPANY.legalName} is incorporated in Singapore under UEN ${COMPANY.uen}, registered on ${COMPANY.incorporationDateDisplay} at ${COMPANY.addressFull}. The company is Singapore Headquartered with procurement and operations teams based in India.`,
  },
  {
    q: "What does EEC do?",
    a: "Elan Exports Consultancy exists to close the trust gap between global buyers and verified manufacturers, replacing opaque trading intermediaries with a transparent, accountable sourcing partner. Our mandate covers supplier identification and qualification, factory assessment, transparent landed cost modelling and shipment coordination, delivered through Scout, Engage or Embed engagement tiers, with operations centred on India and extending across Southeast Asia.",
  },
  {
    q: "Where does EEC operate?",
    a: "EEC is Singapore Headquartered with procurement and operations teams based in India. Active sourcing is conducted primarily across India, with select verified manufacturers in Vietnam, Bangladesh, Indonesia and Thailand for specific product requirements. Buyer programmes serve procurement teams across Europe, the US, the Middle East and Asia-Pacific.",
  },
  {
    q: "How does EEC qualify suppliers?",
    a: "Supplier qualification at EEC is a governance function, not a sales filter. It reflects a deliberate operating decision made at the company's founding: to work exclusively with manufacturers of record and to exclude trading and re-export intermediaries entirely, regardless of the commercial upside they might offer. Every factory in our network is qualified against verified registration, financial standing and independently assessed production capacity, a standard applied uniformly because our credibility as a consultancy depends on it as much as any single buyer relationship does.",
    link: "/for-suppliers#qualification",
    linkText: "See full requirements",
  },
];

const CURRENT_MODEL_STEPS = [
  { n: "01", t: "You send a request", d: "Choose a service and tell us what you need. No payment is taken on the form." },
  { n: "02", t: "EEC reviews and confirms", d: "We check the request and confirm the scope, or send a proposal for custom work." },
  { n: "03", t: "Agreed before work starts", d: "Fixed-fee services are paid in advance after confirmation. Custom work is priced individually." },
  { n: "04", t: "We deliver", d: "You receive the agreed report or support within the stated timeline." },
];

const CURRENT_MODEL_OFFERS = [
  {
    audience: "For buyers",
    href: "/for-buyers#buyer-services",
    items: [
      { t: "Supplier Background Check", d: "Independent desk-based review of one supplier in one country. Target of 3 working days." },
      { t: "India Sourcing Feasibility Snapshot", d: "Desk-based feasibility view for one product and one destination country. Target of 5 working days." },
      { t: "Custom Sourcing & Procurement Support", d: "Supplier identification, RFQ coordination and ongoing sourcing support, scoped and priced individually." },
    ],
  },
  {
    audience: "For suppliers",
    href: "/for-suppliers#export-readiness",
    items: [
      { t: "Complimentary Diagnostic Pilot", d: "Export readiness assessment for up to 10 accepted companies, subject to eligibility review." },
      { t: "Paid Export Support", d: "Practical export support, proposed according to your business, product and target markets." },
    ],
  },
];

export default function About() {
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref =
    isAuthed && user.role === "admin" ? "/admin"
    : isAuthed && user.role === "supplier" ? "/supplier"
    : "/buyer";

  return (
    <div data-testid="about-page">


      <section className="relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG})` }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFFFFF] via-[#FFFFFF]/80 to-[#FFFFFF]/20" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-28 lg:py-36">
          <div className="overline mb-4">About EEC</div>
          <h1 className="sr-only">About Elan Exports Consultancy. Singapore Headquartered Sourcing Consultancy.</h1>
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light text-[#012D76] max-w-3xl" aria-hidden="true">
            Building Trusted Global Sourcing Partnerships
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="overline mb-3">Origin</div>
            <h2 className="font-display text-3xl text-[#012D76] tracking-tight font-light">
              Connecting Global Buyers with Verified Manufacturers
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 text-[#3A4759] leading-relaxed">
            <p>
              Elan Exports Consultancy (EEC) was established to simplify international sourcing by helping businesses identify reliable manufacturing partners and build resilient supply chains. Headquartered in Singapore, EEC combines procurement expertise with a global supplier network to support buyers across a wide range of industries.
            </p>
            <p>
              Rather than operating as a marketplace, EEC works as a strategic sourcing consultancy, supporting supplier identification, supplier qualification, procurement coordination and sourcing strategy. Our approach is built on transparency, collaboration and long-term business relationships.
            </p>
            <p>
              While EEC has developed extensive sourcing expertise and a strong supplier network across India and Asia, we also work with verified manufacturers in other global markets to meet our clients&apos; sourcing requirements.
            </p>
            <Link href="/categories" className="text-sm text-[#012D76] hover:underline">See our active sourcing categories.</Link>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border hairline p-8 bg-surface">
            <div className="text-xs text-[#8A6F2B] tracking-[0.22em] uppercase mb-4">OUR MISSION</div>
            <p className="text-[#3A4759] leading-relaxed">
              To simplify global sourcing by connecting businesses with qualified manufacturing partners, delivering transparent procurement solutions and building long-term relationships that create value for buyers and suppliers alike.
            </p>
          </div>
          <div className="border hairline p-8 bg-surface">
            <div className="text-xs text-[#8A6F2B] tracking-[0.22em] uppercase mb-4">OUR VISION</div>
            <p className="text-[#3A4759] leading-relaxed">
              To be the trusted global sourcing partner for businesses seeking reliable manufacturers, resilient supply chains and sustainable international growth.
            </p>
          </div>
        </div>
      </section>

      <AboutMeFounderSection />

      <TeamSection />

      <section className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Principles</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl mb-12">
            How We Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                t: "Strategic Sourcing",
                d: "Every sourcing project begins with a clear understanding of buyer objectives, product specifications and commercial requirements, enabling us to identify suppliers best suited to the project.",
                link: null,
              },
              {
                t: "Supplier Qualification",
                d: "We work with manufacturers that demonstrate strong production capabilities, quality management systems, export readiness and operational transparency, helping buyers make informed sourcing decisions.",
                link: "/for-suppliers#qualification",
                linkText: "Full supplier qualification process.",
              },
              {
                t: "Long-Term Partnerships",
                d: "We believe successful sourcing is built on trust, communication and collaboration. Our goal is to develop sustainable relationships that create long-term value for both buyers and suppliers.",
                link: null,
              },
            ].map((p) => (
              <div key={p.t} className="border hairline p-8 bg-surface">
                <div className="font-display text-xl text-[#012D76] mb-2">{p.t}</div>
                <div className="text-sm text-[#3A4759] leading-relaxed">{p.d}</div>
                {p.link && (
                  <Link href={p.link} className="block mt-3 text-xs text-[#012D76] hover:underline">{p.linkText}</Link>
                )}
              </div>
            ))}
          </div>
          <div className="mt-16" data-testid="about-current-model">
            <div className="overline mb-3">Our current model</div>
            <h3 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light max-w-3xl mb-4">
              Request first, agree the scope, then we start.
            </h3>
            <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-10">
              Today EEC works through focused, clearly scoped services for buyers and suppliers. Each one is confirmed
              with you before any work begins, so you know what is covered and what is not.
            </p>
            <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#012D76]/15 border hairline mb-10">
              {CURRENT_MODEL_STEPS.map(({ n, t, d }) => (
                <li key={n} className="bg-white p-6">
                  <div className="font-display text-3xl text-[#8A6F2B]">{n}</div>
                  <div className="font-display text-lg text-[#012D76] mt-3 mb-2">{t}</div>
                  <p className="text-sm text-[#3A4759] leading-relaxed">{d}</p>
                </li>
              ))}
            </ol>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {CURRENT_MODEL_OFFERS.map(({ audience, href, items }) => (
                <div key={audience} className="border hairline p-8 bg-white">
                  <div className="text-xs text-[#8A6F2B] tracking-[0.22em] uppercase mb-4">{audience}</div>
                  <ul className="space-y-4">
                    {items.map(({ t, d }) => (
                      <li key={t}>
                        <div className="font-medium text-[#012D76]">{t}</div>
                        <p className="mt-1 text-sm text-[#3A4759] leading-relaxed">{d}</p>
                      </li>
                    ))}
                  </ul>
                  <Link href={href} className="inline-block mt-5 text-sm text-[#012D76] hover:underline font-medium">
                    See {audience.toLowerCase()} services
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12">
            {isAuthed ? (
              <Link href={dashboardHref} className="eec-btn-primary" data-testid="about-cta-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link href="/buyer-service-request" className="eec-btn-primary" data-testid="about-cta">
                Request a Buyer Service <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl mb-12">
            Frequently asked questions about EEC sourcing consultancy
          </h2>
          <FaqAccordion idPrefix="about-faq" items={ABOUT_FAQ.map(({ q, a, link, linkText }) => ({
              q,
              a: <>{a}{link && <> <Link href={link} className="text-[#012D76] hover:underline font-medium">{linkText}.</Link></>}</>,
            }))} />
        </div>
      </section>

    </div>
  );
}
