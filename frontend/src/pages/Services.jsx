import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Search, ClipboardCheck, FileBarChart, Anchor } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";
import { ENGAGEMENT_TIERS } from "@/constants/engagementTiers";
import { COMPANY } from "@/constants/company";

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
  { q: "Which engagement option is right for me?", a: "EEC offers flexible sourcing services designed to meet different business needs. Whether you require supplier discovery, support for a specific sourcing project or ongoing procurement assistance, our team will recommend an engagement approach based on your sourcing objectives." },
  { q: "How long does a sourcing project take?", a: "Project timelines vary depending on product complexity, supplier availability, technical requirements and buyer specifications. Our team works closely with clients to establish realistic timelines and provide regular updates throughout the sourcing process." },
  { q: "Does EEC support freight and logistics?", a: "EEC can assist with procurement coordination and facilitate communication with logistics and supply chain partners where required. The level of support depends on the scope of the sourcing engagement." },
  { q: "Can EEC source multiple product categories?", a: "Yes. EEC supports sourcing across multiple industries and product categories, helping businesses manage sourcing projects with verified manufacturers across different regions and markets." },
  { q: "Can I expand my engagement as my sourcing needs grow?", a: "Yes. Many clients begin with a focused sourcing requirement and expand into broader procurement support as their business grows. Our services are designed to scale alongside your sourcing requirements." },
  { q: "Does EEC coordinate supplier verification?", a: "Yes. Where a sourcing engagement calls for it, EEC manages the verification workflow directly, coordinating capability assessments, documentation review and inspection scheduling with recognised third-party partners, and routing the resulting reports back to you as part of the project deliverables." },
];

export default function Services() {
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref =
    isAuthed && user.role === "admin" ? "/admin"
    : isAuthed && user.role === "supplier" ? "/supplier"
    : "/buyer";

  return (
    <div data-testid="services-page">
      <Seo
        title="Global Sourcing and Procurement Services | Singapore Headquartered | EEC"
        description="EEC provides supplier identification, supplier qualification, procurement support and sourcing strategy for businesses worldwide. Headquartered in Singapore with extensive sourcing expertise across India and Asia."
        canonical="https://eectrade.com/services"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "Services", item: "https://eectrade.com/services" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Sourcing and Procurement Consultancy",
            provider: {
              "@type": "Organization",
              name: COMPANY.legalName,
              url: "https://eectrade.com",
            },
            areaServed: ["Europe", "United States", "Middle East", "Asia"],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "EEC Sourcing Services",
              itemListElement: [
                { "@type": "Offer", itemOffered: { "@type": "Service", name: "Supplier Identification and Qualification", description: "We identify and evaluate manufacturers that align with your product specifications, quality requirements, production capabilities and commercial objectives." } },
                { "@type": "Offer", itemOffered: { "@type": "Service", name: "Supplier Verification and Assessment", description: "Supplier verification through capability assessments, documentation reviews and compliance evaluations." } },
                { "@type": "Offer", itemOffered: { "@type": "Service", name: "Procurement Support", description: "EEC supports procurement activities including supplier coordination, commercial discussions and sourcing strategy." } },
                { "@type": "Offer", itemOffered: { "@type": "Service", name: "Supply Chain Coordination", description: "Coordinating sourcing activities between buyers and suppliers across international supply chains." } },
              ],
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          },
        ]}
      />

      {/* Hero */}
      <section className="border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
          <div className="overline mb-4">Services</div>
          <h1 className="sr-only">Strategic Global Sourcing Services</h1>
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light text-[#012D76] max-w-3xl" aria-hidden="true">
            Sourcing services, <span className="gold-text">unbundled.</span>
          </p>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="border hairline p-8 bg-surface flex gap-6">
              <Icon size={28} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] mt-1 shrink-0" />
              <div>
                <div className="font-display text-2xl text-[#012D76] mb-2">{t}</div>
                <div className="text-[#3A4759] leading-relaxed">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Engagement Tiers */}
      <section id="engagement-tiers" className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Engagement options</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl mb-4">
            Flexible sourcing support for every stage of your procurement journey.
          </h2>
          <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-12">
            EEC offers three engagement models to match different procurement needs. All pricing is scoped and shared at or after the initial discovery call.
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
                <div className="text-sm text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] font-medium mb-2">{p.subtitle}</div>
                <div className="text-[#3A4759] text-sm mb-6">{p.tagline}</div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#3A4759]">
                      <Check size={16} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isAuthed ? (
                  <Link to={dashboardHref} className={p.popular ? "eec-btn-primary" : "eec-btn-secondary"} data-testid={`services-pricing-cta-dashboard-${p.id}`}>
                    Go to dashboard <ArrowUpRight size={14} />
                  </Link>
                ) : (
                  <Link to="/buyer/intake" className={p.popular ? "eec-btn-primary" : "eec-btn-secondary"} data-testid={`services-pricing-cta-${p.id}`}>
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

      {/* FAQ */}
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

    </div>
  );
}
