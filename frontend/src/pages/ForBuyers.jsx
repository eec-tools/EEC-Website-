import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck, FileSpreadsheet, Award, User } from "lucide-react";
import Seo from "@/components/Seo";
import { useAuth } from "@/context/AuthContext";

const BG = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=80";

const BENEFITS = [
  { icon: ShieldCheck, title: "Verified factories only", desc: "IEC registration, GST filing, financial checks and a factory assessment based on category and geography before any RFQ is deployed." },
  { icon: FileSpreadsheet, title: "Landed cost transparency", desc: "Open-book FOB, duty, freight and destination cost modelling with transparent commercial breakdowns before supplier commitment." },
  { icon: Award, title: "Certification-ready suppliers", desc: "Every supplier in the EEC network is screened against the certification requirements of your destination market including FSSAI, BRC/BRCGS, FSSC 22000 and IFS Food for European buyers before any shortlist is shared." },
  { icon: User, title: "Single point of escalation", desc: "One dedicated commercial lead, one quality control lead and one escalation path across all suppliers and product categories." },
];

const COMPARISON = [
  ["Supplier discovery", "Marketplace browsing. No audit, no verification.", "Curated, audited bench. IEC, GST and factory assessment required."],
  ["Quality control", "Self-managed. Buyer coordinates inspection independently.", "EEC pre-shipment AQL + independent third-party inspection."],
  ["Commercials", "Vendor-published price. Margins and layers undisclosed.", "Open-book negotiated. Every cost layer disclosed before commitment."],
  ["Escalations", "Distributed across buyer-side and supplier-side contacts with no defined resolution path.", "Dedicated EEC commercial lead. Single point of contact."],
  ["Cost trajectory", "Price creep each renewal cycle.", "Quarterly cost-out programme tracking landed cost across shipment cycles."],
];

const FAQ = [
  { q: "What does Elan Exports Consultancy (EEC) do for buyers?", a: "Elan Exports Consultancy (EEC) is a Singapore Headquartered global sourcing consultancy that helps buyers identify, evaluate and source from verified manufacturers worldwide. With particular expertise across India and Asia, we support supplier identification, qualification, procurement coordination and sourcing strategy to help businesses build reliable, long-term supply partnerships." },
  { q: "Does EEC guarantee suppliers or purchase outcomes?", a: "No. EEC identifies and qualifies suppliers based on buyer requirements and supports the sourcing process through supplier evaluation and procurement coordination. Final supplier selection, commercial negotiations and purchasing decisions remain with the buyer." },
  { q: "Who does EEC work with?", a: "EEC works with mid-sized businesses, institutional buyers, retailers, importers, distributors and procurement teams across a wide range of industries. We tailor our sourcing approach to each client's procurement objectives, product requirements and business needs." },
  { q: "What industries does EEC specialise in?", a: "EEC specialises in six active sourcing categories: Food Commodities, Processed and Packaged Foods, Fresh and Agricultural Products, Healthcare and Hospital Textile Supplies, Home Textile, Apparel and Hospitality Products, and Eco-Friendly, Sustainable and Organic Products. All sourcing is from verified manufacturers across India and Asia.", link: "/categories", linkText: "See all categories" },
  { q: "How does EEC qualify suppliers?", a: "Every supplier in the EEC network is verified through IEC registration, GST filing, financial checks, factory assessments and compliance documentation review. Our qualification process helps ensure buyers are introduced to reliable manufacturing partners. Trading and re-export businesses are not eligible.", link: "/for-suppliers#qualification", linkText: "Learn more" },
  { q: "Can EEC source from countries other than India?", a: "Yes. The EEC primary sourcing network is across India. For specific product requirements, EEC also sources from verified manufacturers in Vietnam, Bangladesh, Indonesia and Thailand. All suppliers outside India follow the same qualification and audit process as Indian suppliers." },
  { q: "How does EEC support quality and compliance?", a: "Quality and compliance requirements vary by product category and buyer specifications. Where required, EEC coordinates supplier verification, product evaluations and independent third-party inspections through accredited inspection agencies. Inspection reports are shared directly with the buyer before goods are shipped." },
  { q: "What certifications does EEC consider during supplier evaluation?", a: "Certification requirements vary by category and destination market. For European food buyers, baseline requirements typically include FSSAI, BRC/BRCGS or FSSC 22000 and HACCP. German and French buyers additionally require IFS Food. Organic products require EU Organic certification or NPOP equivalence. Frozen seafood requires EU Health Certificates and ASC or MSC certification.", link: "/for-buyers#certifications", linkText: "Full certification breakdown by category" },
  { q: "What is a sourcing brief?", a: "A sourcing brief is a document that outlines product specifications, quality expectations, commercial requirements and sourcing objectives. It enables our sourcing specialists to identify manufacturers best suited to the buyer procurement needs." },
  { q: "How do I start working with EEC as a buyer?", a: "The fastest way to start is a free 20-minute discovery call with no commitment required. EEC maps your sourcing category, target landed cost, compliance requirements and timelines. After the call, EEC recommends the appropriate engagement tier and provides a scope and pricing outline within 2 working days. Buyers can also submit a sourcing brief directly through the EEC Buyer Portal, which takes under 5 minutes to complete." },
  { q: "Why choose Elan Exports Consultancy?", a: "EEC combines global sourcing expertise with strong supplier relationships, particularly across India and Asia. Headquartered in Singapore, we help businesses simplify international procurement through verified manufacturers, transparent sourcing practices and long-term procurement partnerships, enabling buyers to source with greater confidence." },
];

export default function ForBuyers() {
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref = isAuthed && user.role === "admin" ? "/admin" : isAuthed && user.role === "buyer" ? "/buyer" : "/supplier";

  return (
    <div data-testid="for-buyers-page">
      <Seo
        title="For Buyers | India Procurement Sourcing Consultancy | EEC"
        description="EEC helps institutional buyers source from verified manufacturers worldwide. Headquartered in Singapore, we specialise in supplier qualification, procurement support and sourcing across India, Asia and global markets."
        canonical="https://eectrade.com/for-buyers"
        ogTitle="For Buyers | India Procurement Sourcing Consultancy | EEC"
        ogDescription="EEC helps institutional buyers source from verified manufacturers worldwide. Singapore Headquartered. Open-book costs. Factory-audited suppliers."
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "For Buyers", item: "https://eectrade.com/for-buyers" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.filter(({ link }) => !link || link === "/for-buyers#certifications").map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG})` }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFFFFF] via-[#FFFFFF]/80 to-[#FFFFFF]/20" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-28 lg:py-36">
          <div className="overline mb-4">For Buyers</div>
          <h1 className="sr-only">Procurement Sourcing Services for Global Buyers</h1>
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light text-[#012D76] max-w-3xl" aria-hidden="true">
            Outsource sourcing. <span className="gold-text font-medium italic">Not accountability.</span>
          </p>
          <p className="mt-6 text-[#3A4759] max-w-2xl text-lg">
            For procurement teams managing multi-category sourcing across India and Asia who need <span className="text-[#8F7228] font-semibold">audited supply</span>, <span className="text-[#8F7228] font-semibold">strategic sourcing</span> and <span className="text-[#8F7228] font-semibold">supply chain visibility</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {isAuthed ? (
              <Link to={dashboardHref} className="eec-btn-primary" data-testid="buyer-cta-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link to="/buyer/intake" className="eec-btn-primary" data-testid="buyer-cta-brief">
                Submit a sourcing brief <ArrowUpRight size={16} />
              </Link>
            )}
            <Link to="/buyer/intake" className="eec-btn-secondary">Book a free discovery call</Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-[#3A4759] text-lg leading-relaxed max-w-4xl">
            EEC is a <span className="text-[#8F7228] font-semibold">Singapore Headquartered</span> global sourcing consultancy connecting procurement teams with <span className="text-[#8F7228] font-semibold">verified manufacturers worldwide</span>. Our expertise in supplier qualification, strategic sourcing and procurement, with specialised focus across India and Asia, helps businesses build transparent, <span className="text-[#8F7228] font-semibold">long-term supply chain partnerships</span>.
          </p>
        </div>
      </section>

      {/* Why EEC */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Why EEC</div>
          <h2 className="sr-only">Why Procurement Teams Choose EEC Over Direct Sourcing</h2>
          <p className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl" aria-hidden="true">
            Built for procurement teams, not for browsing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border hairline p-8 bg-surface">
                <Icon size={22} className="text-[#A6831F]" />
                <div className="font-display text-xl text-[#012D76] mt-6 mb-2">{title}</div>
                <p className="text-sm text-[#3A4759] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Direct Sourcing vs EEC</div>
          <h2 className="sr-only">EEC vs Direct Sourcing: A Procurement Team's Comparison</h2>
          <p className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-10" aria-hidden="true">
            Why mature procurement teams switch from direct sourcing.
          </p>
          <div className="overflow-x-auto border hairline">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#012D76] text-white">
                  <th className="text-left px-6 py-4 font-medium text-xs tracking-wider uppercase">Dimension</th>
                  <th className="text-left px-6 py-4 font-medium text-xs tracking-wider uppercase">Direct Sourcing</th>
                  <th className="text-left px-6 py-4 font-medium text-xs tracking-wider uppercase text-[#C9A23F]">With EEC</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([dim, direct, eec], i) => (
                  <tr key={dim} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"}>
                    <td className="px-6 py-4 font-medium text-[#012D76] border-t hairline">{dim}</td>
                    <td className="px-6 py-4 text-[#3A4759] border-t hairline">{direct}</td>
                    <td className="px-6 py-4 text-[#8F7228] font-medium border-t hairline">{eec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border hairline bg-[#FFFFFF] p-6">
            <p className="text-[#3A4759] text-sm">See how EEC would work for your category.</p>
            <Link to="/buyer/intake" className="eec-btn-primary" data-testid="compare-cta-buyers">
              Submit a sourcing brief <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Buyer Portal */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <div className="overline mb-3">Buyer Portal</div>
            <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-4">
              EEC Buyer Portal. Manage Your Sourcing Pipeline in One Place.
            </h2>
            <p className="text-[#3A4759] leading-relaxed mb-8">
              The EEC Buyer Portal gives live visibility into every active sourcing brief, supplier shortlist, QC sample status and shipment milestone. No spreadsheets. No email chasing. Submit a brief in under 5 minutes and our team responds within two working days.
            </p>
            <div className="flex flex-col gap-3">
              {isAuthed ? (
                <Link to={dashboardHref} className="eec-btn-primary self-start" data-testid="buyer-portal-dashboard">
                  Go to dashboard <ArrowUpRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/buyer/intake" className="eec-btn-primary self-start" data-testid="buyer-portal-brief">
                    Submit a brief <ArrowUpRight size={16} />
                  </Link>
                  <p className="text-sm text-[#3A4759]">
                    <Link to="/login" className="text-[#012D76] hover:underline">Already have an account? Sign in.</Link>
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="border hairline bg-surface p-8">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8F7228] font-semibold mb-6">SAMPLE BRIEF. ILLUSTRATIVE DATA ONLY.</div>
              <div className="space-y-4">
                {[
                  ["Category", "Home textiles"],
                  ["Volume", "120K units / yr"],
                  ["Suppliers shortlisted", "6"],
                  ["QC samples received", "3"],
                  ["Landed cost vs target", "Below target"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center border-b hairline pb-3">
                    <span className="text-sm text-[#3A4759]">{label}</span>
                    <span className="text-sm font-medium text-[#012D76]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="certifications" className="py-16 border-t border-b hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-2xl text-[#012D76] tracking-tight font-light mb-3">
            Supplier Compliance Screening for European and Global Buyers
          </h2>
          <p className="text-sm text-[#3A4759] leading-relaxed mb-6">
            EEC screens every supplier against the certification requirements of your destination market before shortlisting. European food buyers typically require BRC/BRCGS, FSSC 22000, FSSAI and IFS Food as a baseline.
          </p>
          <div className="flex items-start gap-6 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#3A4759] font-semibold whitespace-nowrap shrink-0 mt-0.5">Compliance screened for</span>
            <p className="text-sm text-[#3A4759] leading-relaxed">
              BSCI · SEDEX · SA8000 · SMETA · OEKO-TEX Standard 100 · GOTS · FSSAI · HACCP · ISO 22000 · FSSC 22000 · BRC/BRCGS · IFS Food · GlobalG.A.P. · GRASP · GMP · ISO 9001 · NPOP · EU Organic
            </p>
          </div>
          <p className="mt-4 text-xs text-[#6B7280]">Certifications are supplier-held. EEC screens and verifies compliance documentation on every supplier before network approval.</p>
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <Link to="/buyer/intake" className="eec-btn-secondary text-sm">Request a supplier audit report</Link>
            <Link to="/for-suppliers#qualification" className="text-sm text-[#012D76] hover:underline">See how suppliers are qualified</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-8">
            Frequently asked questions about EEC sourcing services for buyers
          </h2>
          <div className="border hairline bg-surface overflow-hidden">
            {FAQ.map(({ q, a, link, linkText }, idx) => (
              <div key={q} className={`${idx !== FAQ.length - 1 ? "border-b hairline" : ""} grid grid-cols-1 md:grid-cols-[36%_1fr]`}>
                <div className="p-5 md:p-6 font-medium text-[#012D76]">{q}</div>
                <div className="p-5 md:p-6 text-[#3A4759] leading-relaxed">
                  {a}{link && <> <Link to={link} className="text-[#012D76] hover:underline font-medium">{linkText}.</Link></>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border hairline bg-[#FFFFFF] p-6">
            <p className="text-[#3A4759] text-sm">Ready to discuss your sourcing requirements?</p>
            <Link to="/buyer/intake" className="eec-btn-primary" data-testid="faq-cta-buyers">
              Book a free 20-minute call <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
