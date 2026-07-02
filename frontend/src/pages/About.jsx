import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";
import { COMPANY } from "@/constants/company";
import TeamSection from "@/components/TeamSection";
import AboutFounderSection from "@/components/AboutFounderSection";

// TODO: Replace empty office corridor with sourcing/logistics/factory imagery for About page hero
const BG = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=80";

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
    a: "Elan Exports Consultancy (EEC) is a Singapore Headquartered sourcing and procurement consultancy that connects international buyers with verified manufacturers across India and Asia. Core services include supplier identification and qualification, factory assessments, landed cost modelling and shipment coordination. Available through Scout, Engage or Embed engagement tiers.",
  },
  {
    q: "Where does EEC operate?",
    a: "EEC is Singapore Headquartered with procurement and operations teams based in India. Active sourcing is conducted primarily across India, with select verified manufacturers in Vietnam, Bangladesh, Indonesia and Thailand for specific product requirements. Buyer programmes serve procurement teams across Europe, the US, the Middle East and Asia-Pacific.",
  },
  {
    q: "How does EEC qualify suppliers?",
    a: "EEC qualifies manufacturers through IEC registration, GST verification, financial checks, factory assessments and compliance documentation review. Trading and re-export businesses are not eligible.",
    link: "/for-suppliers#qualification",
    linkText: "See full requirements",
  },
  {
    q: "How does EEC price its services?",
    a: "EEC does not publish fixed pricing. Scout is a one-time fixed-fee project. Engage (per sourcing project) and Embed (quarterly retainer) are priced based on category complexity, order volume and sourcing geography, confirmed at or after the initial discovery call. No fees are charged to suppliers at any stage.",
    link: "/services",
    linkText: "See engagement models",
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
      <Seo
        title="About Elan Exports Consultancy | Singapore Headquartered Global Sourcing Consultancy"
        description="Elan Exports Consultancy (EEC) is a Singapore Headquartered global sourcing consultancy connecting buyers with verified manufacturers worldwide. With particular expertise across India and Asia, we help businesses build reliable procurement and supply chain partnerships."
        canonical="https://eectrade.com/about"
        ogTitle="About EEC | Singapore Sourcing Consultancy | Elan Exports Consultancy"
        ogDescription="Elan Exports Consultancy (EEC) is a Singapore Headquartered global sourcing consultancy connecting buyers with verified manufacturers worldwide."
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "About", item: "https://eectrade.com/about" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: COMPANY.legalName,
            alternateName: COMPANY.shortName,
            url: "https://eectrade.com",
            email: COMPANY.contactEmail,
            foundingDate: COMPANY.incorporationDateISO,
            identifier: COMPANY.uen,
            description: "Singapore Headquartered sourcing and procurement consultancy connecting global buyers with verified manufacturers across India and Asia. Incorporated January 2025.",
            address: {
              "@type": "PostalAddress",
              streetAddress: COMPANY.addressStreet,
              addressLocality: COMPANY.addressCity,
              postalCode: COMPANY.addressPostalCode,
              addressCountry: COMPANY.addressCountry,
            },
            areaServed: ["Europe", "United States", "Middle East", "Asia-Pacific"],
            knowsAbout: ["Sourcing", "Procurement", "Supplier qualification", "Factory audits", "Landed cost modelling", "India manufacturing", "Asia supply chain"],
            sameAs: COMPANY.socialLinks,
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: ABOUT_FAQ.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          },
        ]}
      />

      {/* Hero */}
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

      {/* Origin */}
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
              While EEC has developed extensive sourcing expertise and a strong supplier network across India and Asia, we also work with verified manufacturers in other global markets to meet our clients' sourcing requirements.
            </p>
            <Link to="/categories" className="text-sm text-[#012D76] hover:underline">See our active sourcing categories.</Link>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border hairline p-8 bg-surface">
            <div className="text-xs text-[#8F7228] tracking-[0.22em] uppercase mb-4">OUR MISSION</div>
            <p className="text-[#3A4759] leading-relaxed">
              To simplify global sourcing by connecting businesses with qualified manufacturing partners, delivering transparent procurement solutions and building long-term relationships that create value for buyers and suppliers alike.
            </p>
          </div>
          <div className="border hairline p-8 bg-surface">
            <div className="text-xs text-[#8F7228] tracking-[0.22em] uppercase mb-4">OUR VISION</div>
            <p className="text-[#3A4759] leading-relaxed">
              To be the trusted global sourcing partner for businesses seeking reliable manufacturers, resilient supply chains and sustainable international growth.
            </p>
          </div>
        </div>
      </section>

      <AboutFounderSection
        name="Shirali Shetty"
        eyebrowText="The Founder Behind Elan Exports"
        headline="About Me"
        paragraphs={[
          "Hi, I'm Shirali Shetty. I founded Elan Exports Consultancy to solve a problem I saw first-hand: global buyers were spending years building the trusted supplier relationships that large enterprises take for granted from day one.",
          "With over 20 years of experience in global sourcing, procurement and international trade across India and Asia, I've built EEC around transparent, open-book commercials, factory-audited suppliers and sourcing plans that hold up under real order volumes.",
          "Whether it's a first sourcing brief or a multi-year supply chain, my goal is the same — give buyers the same access, visibility and reliability that was previously available only to the biggest players in the room.",
        ]}
        photoSrc="/images/team/image.webp"
        photoAlt="Shirali Shetty, Founder and CEO of Elan Exports Consultancy"
        signatureText="Shirali Shetty"
        socialLinks={{
          linkedin: COMPANY.socialLinks[0],
          instagram: COMPANY.socialLinks[1],
          email: `mailto:${COMPANY.contactEmail}`,
          whatsapp: "https://wa.me/6586784216",
        }}
      />

      <TeamSection />

      {/* Principles */}
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
                  <Link to={p.link} className="block mt-3 text-xs text-[#012D76] hover:underline">{p.linkText}</Link>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12">
            {isAuthed ? (
              <Link to={dashboardHref} className="eec-btn-primary" data-testid="about-cta-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link to="/buyer/intake" className="eec-btn-primary" data-testid="about-cta">
                Talk to Our Sourcing Team <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl mb-12">
            Frequently asked questions about EEC sourcing consultancy
          </h2>
          <div className="border hairline overflow-hidden bg-[#FFFFFF]">
            {ABOUT_FAQ.map(({ q, a, link, linkText }, idx) => (
              <div key={q} className={`grid grid-cols-1 md:grid-cols-[36%_1fr] ${idx !== ABOUT_FAQ.length - 1 ? "border-b hairline" : ""}`}>
                <div className="p-5 md:p-6 font-medium text-[#012D76]">{q}</div>
                <div className="p-5 md:p-6 text-[#3A4759] leading-relaxed">
                  {a}{link && <> <Link to={link} className="text-[#012D76] hover:underline font-medium">{linkText}.</Link></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
