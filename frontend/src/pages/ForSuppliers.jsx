import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Factory, FileBadge, TrendingUp, Handshake } from "lucide-react";
import Seo from "@/components/Seo";
import { useAuth } from "@/context/AuthContext";
import { CertLogo, CertMarquee } from "@/components/CertLogoMarquee";

const BG = "https://images.unsplash.com/photo-1720036236697-018370867320?auto=format&fit=crop&w=1800&q=80";
// TODO: Replace metalworking image with food/textile/packaged goods production image
const SECONDARY = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80";

const BENEFITS = [
  { icon: TrendingUp, title: "Quality, recurring orders", desc: "Designed for long-term sourcing partnerships rather than one-off transactions. EEC connects qualified suppliers with international procurement teams across Europe, the US, the Middle East and Asia through structured programmes and clearly defined sourcing requirements." },
  { icon: Handshake, title: "Direct buyer access", desc: "EEC pre-qualifies you. You meet procurement decision-makers, not category assistants or intermediary agents. Your factory is presented with an EEC audit report, not a cold profile. Buyers span procurement teams across Europe, the US, the Middle East and Asia." },
  { icon: FileBadge, title: "Faster payments", desc: "EEC targets structured payment terms and works to protect suppliers from extended payment cycles that erode working capital. Faster payment terms than typical direct export transactions." },
  { icon: Factory, title: "Capacity planning", desc: "EEC shares buyer programme requirements and indicative volumes in advance, giving suppliers better visibility into pipeline demand than spot-RFQ models." },
];

const REQS = [
  "Valid IEC (Import Export Code) and GST registration, current and in active compliance",
  "Established manufacturing operations at the production facility level with a proven export history and prior international shipments.",
  "Factory audit-ready. BSCI, SEDEX or equivalent audit scheduled within 90 days of network activation",
  "Documented quality management system (ISO 9001 preferred; internal QMS acceptable if ISO is in progress)",
  "Demonstrated export experience to North America (NA), Europe (EU), Middle East (ME) or Asia-Pacific (APAC) markets",
];

// NOTE: FSSC 22000 is built on top of ISO 22000, not an interchangeable "or" alternative — removed the
// "or ISO 22000" phrasing below. Flag for manual review: if EEC buyers independently accept ISO 22000 alone
// in some cases, that should be reintroduced as its own line rather than an "or" option.
// NOTE: EU Health Certificate and Rainforest Alliance don't map cleanly to an existing category (they're
// most relevant to frozen food / dried fruit sub-segments). Folded into Food Commodities for now — flag for
// manual review on whether these warrant their own category longer-term.
const CERT_CARDS = [
  { cat: "Food Commodities", certs: ["HACCP", "FSSC 22000", "BRC/BRCGS", "amfori BSCI", "FSSAI", "MRL Testing Reports", "Phytosanitary Certificate", "Aflatoxin Testing Reports", "EU Health Certificate", "Rainforest Alliance"], note: "FSSAI registration is mandatory." },
  { cat: "Processed and Packaged Foods", certs: ["BRC/BRCGS", "HACCP", "FSSC 22000", "amfori BSCI", "FSSAI", "Aflatoxin Testing Reports"], note: "IFS Food required for buyers in Germany and France." },
  { cat: "Fresh and Agricultural Products", certs: ["GlobalG.A.P.", "GRASP", "SMETA", "amfori BSCI", "Phytosanitary Certificate", "MRL Testing Reports"], note: null },
  { cat: "Healthcare and Hospital Textile Supplies", certs: ["ISO 9001", "OEKO-TEX Standard 100", "BSCI"], note: "EEC sources hospital textiles, PPE, medical linen and non-regulated consumables. Medical devices, pharmaceuticals and regulated clinical products are outside EEC scope." },
  { cat: "Home Textile, Apparel and Hospitality Products", certs: ["BSCI", "SEDEX", "OEKO-TEX Standard 100", "GOTS", "OEKO-TEX STEP"], note: null },
  { cat: "Eco-Friendly, Sustainable and Organic Products", certs: ["ISO 9001", "GOTS", "EU Organic", "NPOP"], note: null },
];

const CERT_WALL = {
  // SA8000 kept without a space to match existing sitewide usage (see Home.jsx / ForBuyers.jsx trust bars).
  Textiles: ["BSCI", "SEDEX", "GOTS", "OEKO-TEX Standard 100", "OEKO-TEX STEP", "GRS", "ISO 9001", "ISO 14001", "CE", "WRAP", "Higg Index", "SA8000"],
  Food: ["FSSAI", "HACCP", "BRC/BRCGS", "FSSC 22000", "IFS Food", "GlobalG.A.P.", "GRASP", "EU Organic", "NPOP", "Kosher", "Halal", "ASC", "MSC", "amfori BSCI", "EU Health Certificate", "Rainforest Alliance", "Aflatoxin Testing Reports", "Phytosanitary Certificate", "MRL Testing Reports", "SMETA"],
};

const FAQ = [
  ["What is the EEC Supplier Network?", "The EEC Supplier Network is a curated network of verified manufacturers connected with procurement teams through Elan Exports Consultancy. As a Singapore Headquartered global sourcing consultancy, EEC facilitates international sourcing opportunities across multiple categories, with particular expertise in India and Asia."],
  ["Who can apply to join the EEC Supplier Network?", "Manufacturers and producers across the six EEC active categories are welcome to apply. We evaluate suppliers based on manufacturing capability, product quality, export readiness, compliance standards and alignment with buyer requirements. Trading and re-export businesses are not eligible."],
  ["How does EEC qualify suppliers?", "EEC qualifies suppliers through a structured five-stage process: valid IEC and GST registration, established manufacturing operations with a proven export history (trading and re-export businesses are not eligible), factory audit-readiness with BSCI or SEDEX audit scheduled within 90 days of network activation, a documented quality management system (ISO 9001 preferred), and demonstrated export experience to North America, Europe, the Middle East or Asia-Pacific markets. Every qualifying supplier receives an EEC audit report that is shared with buyers, not a cold directory profile."],
  ["Do I need all certifications to apply to EEC?", "No. You do not need every certification at application stage. Factory audit-readiness is what qualifies you. Specifically, willingness to schedule a BSCI or SEDEX audit within 90 days of network activation. EEC provides a certification roadmap during onboarding, aligned to the specific buyer markets your category targets."],
  ["Does joining the EEC Supplier Network guarantee orders?", "No. Joining the EEC Supplier Network does not guarantee purchase orders or contracts. Qualified suppliers may be considered for relevant sourcing opportunities when their products, capabilities and commercial offering align with buyer requirements."],
  ["Which countries and industries does EEC serve?", "EEC active sourcing categories are: Food Commodities, Processed and Packaged Foods, Fresh and Agricultural Products, Healthcare and Hospital Textile Supplies, Home Textile, Apparel and Hospitality Products, and Eco-Friendly, Sustainable and Organic Products. Buyers span procurement teams across the EU, US, Canada, Middle East and Asia-Pacific."],
  ["Does EEC work only with suppliers from India and Asia?", "The EEC primary supplier network is across India, with select verified manufacturers in Vietnam, Bangladesh, Indonesia and Thailand. Suppliers from other markets may be considered for specific buyer requirements on a case-by-case basis."],
  ["What makes EEC different from a B2B marketplace?", "EEC is a sourcing consultancy, not a marketplace. Buyer-fee model, open-book costs, no supplier listing fees. We work closely with buyers and suppliers throughout the sourcing process.", "/about"],
];

export default function ForSuppliers() {
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref = isAuthed && user.role === "admin" ? "/admin" : isAuthed && user.role === "supplier" ? "/supplier" : "/buyer";

  return (
    <div data-testid="for-suppliers-page">
      <Seo
        title="Join EEC Supplier Network | Export to Global Buyers | EEC"
        description="Apply to join the EEC verified supplier network. Connect with procurement teams across Europe, the US and the Middle East. IEC and GST registration required. No listing fees."
        canonical="https://eectrade.com/for-suppliers"
        ogTitle="Join EEC Supplier Network | Export to Global Buyers | EEC"
        ogDescription="Apply to join the EEC verified supplier network. Connect with procurement teams across Europe, the US and the Middle East. IEC and GST registration required. No listing fees."
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "For Suppliers", item: "https://eectrade.com/for-suppliers" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.filter(entry => entry.length < 3).map(([question, answer]) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG})` }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFFFFF] via-[#FFFFFF]/80 to-[#FFFFFF]/20" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-28 lg:py-36">
          <div className="overline mb-4">For Suppliers</div>
          <h1 className="sr-only">Join the EEC Verified Supplier Network. Export to Global Buyers from India.</h1>
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light text-[#012D76] max-w-3xl" aria-hidden="true">
            Build a recurring export book with <span className="gold-text font-medium">verified global buyers.</span>
          </p>
          <p className="mt-6 text-[#3A4759] max-w-2xl text-lg">
            Join the EEC <span className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] font-semibold">qualified supplier network</span> and connect with <span className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] font-semibold">international procurement programmes</span> across food commodities, fresh and agricultural products, processed and packaged foods, healthcare and hospital textile supplies, home textiles, apparel and hospitality products, and eco-friendly, sustainable and organic products.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {isAuthed ? (
              <Link to={dashboardHref} className="eec-btn-primary" data-testid="supplier-cta-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link to="/register?role=supplier" className="eec-btn-primary" data-testid="supplier-cta-apply">
                Apply to Network <ArrowUpRight size={16} />
              </Link>
            )}
            <Link to="#qualification" className="eec-btn-secondary">See qualification requirements</Link>
          </div>
        </div>
      </section>

      {/* Sourcing context */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl space-y-8">
            <p className="text-base lg:text-lg leading-relaxed text-[#3A4759]">
              We maintain <span className="text-[#012D76] font-semibold">dedicated supplier benches</span> for each category. Click a category to see the products EEC sources, the certifications screened and the brief format we use.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Why join</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl">
            What Verified Indian Manufacturers Gain from the EEC Supplier Network
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border hairline p-8 bg-surface">
                <Icon size={22} className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" />
                <div className="font-display text-xl text-[#012D76] mt-6 mb-2">{title}</div>
                <p className="text-sm text-[#3A4759] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#3A4759]">
            <Link to="/for-buyers" className="text-[#012D76] hover:underline">See what buyers receive from EEC</Link>
          </p>
        </div>
      </section>

      {/* Qualification */}
      <section id="qualification" className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="overline mb-3">Qualification</div>
            <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light">
              Supplier Qualification Requirements: What EEC Looks For Before Approval
            </h2>
            <p className="mt-4 text-[#3A4759] leading-relaxed">
              EEC carefully evaluates every supplier for manufacturing capability, export readiness, quality management, compliance and operational transparency. Meeting these requirements means your factory is presented to international procurement teams with an EEC audit report, not a cold profile or a directory listing.
            </p>
            {isAuthed ? (
              <Link to={dashboardHref} className="eec-btn-primary mt-8" data-testid="supplier-cta-req-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link to="/register?role=supplier" className="eec-btn-primary mt-8" data-testid="supplier-cta-req-apply">
                Start application <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
          <div className="lg:col-span-7">
            <div className="border hairline border-[#C9A23F]/60 bg-[#FDF8EE] p-4 mb-4 text-sm text-[#5C3A00]">
              Important: Trading and re-export businesses are not eligible to apply. EEC works exclusively with manufacturers operating their own production facilities.
            </div>
            <div className="border hairline">
              {REQS.map((r, i) => (
                <div key={r} className={`p-6 flex items-start gap-4 ${i !== 0 ? "border-t hairline" : ""}`}>
                  <span className="font-display text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] text-sm">0{i + 1}</span>
                  <span className="text-[#012D76]/90">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application Flow */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative">
            <img src={SECONDARY} alt="Fresh produce and agricultural products from EEC supplier sourcing categories" loading="lazy" decoding="async" className="w-full h-[480px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FFFFFF]/40 via-transparent to-transparent" aria-hidden="true" />
          </div>
          <div className="lg:col-span-6">
            <div className="overline mb-3">Application Flow</div>
            <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-4">
              How to Join the EEC Supplier Network: 4-Step Application Process
            </h2>
            <p className="text-sm text-[#3A4759] leading-relaxed mb-6">
              EEC supplier onboarding covers document submission, a structured qualification review and a factory assessment, all completed before a supplier profile is activated and shared with buyer procurement teams.
            </p>
            <ol className="space-y-6">
              {[
                "Submit factory profile and documents",
                "Documentation review (3 to 5 business days)",
                "Factory assessment: on-ground for food, healthcare and high-volume categories; documentary review for initial qualification in other categories. Audit type confirmed at documentation review stage.",
                "Network activation: your factory profile and EEC audit report are made available to relevant buyer procurement teams. You are notified when your profile is matched to an active sourcing brief.",
              ].map((s, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="font-display text-3xl text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]">{(i + 1).toString().padStart(2, "0")}</span>
                  <div className="pt-2">
                    <div className="text-[#012D76] text-sm leading-relaxed">{s}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section id="certifications" className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Certification requirements</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-6">
            Certification Requirements by Product Category: What EEC Screens For
          </h2>
          <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-8">
            Required certifications vary by product category. You do not need every certification at application stage. Factory audit-readiness is what qualifies you. EEC can guide approved suppliers through the certification roadmap during onboarding.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CERT_CARDS.map(({ cat, certs, note }) => (
              <div key={cat} className="border hairline p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] font-semibold mb-3">{cat}</div>
                <CertMarquee names={certs} />
                {note && <p className="mt-3 text-xs text-[#6B7280] leading-relaxed">{note}</p>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#6B7280]">All suppliers additionally require IEC and GST registration.</p>

          <div className="mt-14">
            <div className="overline mb-3">Standards we screen for</div>
            <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-8">
              Certifications are supplier-held and screened during qualification, grouped here by the two broad categories above.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(CERT_WALL).map(([group, certs]) => (
                <div key={group} className="border hairline p-6">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] font-semibold mb-4">{group}</div>
                  <div className="flex flex-wrap items-center gap-3">
                    {certs.map((c) => (
                      <div key={c} className="flex items-center justify-center">
                        <CertLogo name={c} className="h-9" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-24 border-t hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-8">
            Frequently asked questions from suppliers about joining the EEC network
          </h2>
          <div className="border hairline bg-surface overflow-hidden">
            {FAQ.map(([q, a, link], idx) => (
              <div key={q} className={`${idx !== FAQ.length - 1 ? "border-b hairline" : ""} grid grid-cols-1 md:grid-cols-[36%_1fr]`}>
                <div className="p-5 md:p-6 font-medium text-[#012D76]">{q}</div>
                <div className="p-5 md:p-6 text-[#3A4759] leading-relaxed">
                  {link ? (
                    <>{a} <Link to={link} className="text-[#012D76] hover:underline font-medium">Learn more.</Link></>
                  ) : a}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border hairline bg-[#FFFFFF] p-6">
            <p className="text-[#3A4759] text-sm">Ready to apply? Start your factory profile now.</p>
            <Link to="/register?role=supplier" className="eec-btn-primary" data-testid="faq-cta-suppliers">
              Apply to the EEC Network <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
