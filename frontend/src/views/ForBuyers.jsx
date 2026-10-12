"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, FileSpreadsheet, Award, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CertLogosMarquee } from "@/components/CertLogoMarquee";
import BuyerServiceOffers from "@/components/BuyerServiceOffers";

const BG = "/images/hero-about-buyers.jpg";

const COMPLIANCE_CERTS = ["BSCI", "SEDEX", "SA8000", "SMETA", "OEKO-TEX Standard 100", "GOTS", "FSSAI", "HACCP", "ISO 22000", "FSSC 22000", "BRC/BRCGS", "IFS Food", "GlobalG.A.P.", "GRASP", "GMP", "ISO 9001", "NPOP", "EU Organic"];

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
  { q: "What does Elan Exports Consultancy (EEC) do for buyers?", a: "EEC functions as your embedded overseas procurement office, managing supplier risk, sourcing timelines and category strategy so your team doesn't have to build in-market infrastructure from scratch. We handle supplier identification, qualification, procurement coordination and ongoing sourcing strategy, giving buyers a single accountable partner for reliable, long-term supply relationships." },
  { q: "Does EEC guarantee suppliers or purchase outcomes?", a: "No. EEC identifies and qualifies suppliers based on buyer requirements and supports the sourcing process through supplier evaluation and procurement coordination. Final supplier selection, commercial negotiations and purchasing decisions remain with the buyer." },
  { q: "Who does EEC work with?", a: "EEC works with mid-sized businesses, institutional buyers, retailers, importers, distributors and procurement teams across a wide range of industries. We tailor our sourcing approach to each client's procurement objectives, product requirements and business needs." },
  { q: "What industries does EEC specialise in?", a: "EEC specialises in six active sourcing categories: Food Commodities, Processed and Packaged Foods, Fresh and Agricultural Products, Healthcare and Hospital Textile Supplies, Home Textile, Apparel and Hospitality Products, and Eco-Friendly, Sustainable and Organic Products.", link: "/categories", linkText: "See all categories" },
  { q: "How does EEC qualify suppliers?", a: "We mitigate supply chain risk before you ever see an RFQ: every manufacturer is screened through background checks, verification of regulatory and tax filings, financial due diligence, and an on-site audit of structural and production capacity. Trading and re-export intermediaries are excluded entirely, so buyers deal only with the entity actually producing their goods." },
  { q: "Can EEC source from countries other than India?", a: "Yes. While India anchors our primary sourcing network, EEC also maintains a smaller, tightly audited base of manufacturers across Southeast Asia. This gives buyers a built-in diversification option, reducing single-country exposure, while accessing technical specialisations some categories require, such as garment capacity in Bangladesh or footwear and furniture production out of Vietnam. Every supplier outside India clears the same qualification and audit standard as our Indian network." },
  { q: "How does EEC support quality and compliance?", a: "Quality and compliance requirements vary by product category and buyer specifications. Where required, EEC coordinates supplier verification, product evaluations and independent third-party inspections through accredited inspection agencies. Inspection reports are shared directly with the buyer before goods are shipped." },
  { q: "What certifications does EEC consider during supplier evaluation?", a: "Compliance verification is part of our core risk-mitigation process, not an afterthought. Requirements are matched to your destination market and product category, for example, BRC/BRCGS and HACCP for EU food buyers, or IFS Food for German and French accounts.", link: "/for-buyers#certifications", linkText: "Full compliance screening breakdown" },
  { q: "What is a sourcing brief?", a: "A sourcing brief is a document that outlines product specifications, quality expectations, commercial requirements and sourcing objectives. It enables our sourcing specialists to identify manufacturers best suited to the buyer procurement needs." },
  { q: "How do I start working with EEC as a buyer?", a: "The fastest way to start is a free 20-minute discovery call with no commitment required. EEC maps your sourcing category, target landed cost, compliance requirements and timelines. After the call, EEC recommends the appropriate engagement tier and provides a scope and pricing outline within 2 working days. Buyers can also submit a sourcing brief directly through the EEC Buyer Portal, which takes under 5 minutes to complete." },
  { q: "Why choose Elan Exports Consultancy?", a: "Buyers choose EEC for the same reason they'd hire an in-house procurement office rather than trust a broker: full cost transparency, boots-on-the-ground factory management, and zero hidden trading margins. Every landed cost is modelled open-book before you commit, and every supplier is verified independently." },
];

export default function ForBuyers() {
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref = isAuthed && user.role === "admin" ? "/admin" : isAuthed && user.role === "buyer" ? "/buyer" : "/supplier";

  return (
    <div data-testid="for-buyers-page">


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
            For procurement teams managing multi-category sourcing across India and Asia who need <span className="text-[#8A6F2B] font-semibold">audited supply</span>, <span className="text-[#8A6F2B] font-semibold">strategic sourcing</span> and <span className="text-[#8A6F2B] font-semibold">supply chain visibility</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {isAuthed ? (
              <Link href={dashboardHref} className="eec-btn-primary" data-testid="buyer-cta-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link href="/buyer-service-request" className="eec-btn-primary" data-testid="buyer-cta-brief">
                Request a Buyer Service <ArrowUpRight size={16} />
              </Link>
            )}
            <Link href="#buyer-services" className="eec-btn-secondary">See buyer services</Link>
          </div>
        </div>
      </section>

      <section className="py-16 border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-[#3A4759] text-lg leading-relaxed max-w-4xl">
            EEC is a <span className="text-[#8A6F2B] font-semibold">Singapore Headquartered</span> global sourcing consultancy connecting procurement teams with <span className="text-[#8A6F2B] font-semibold">verified manufacturers worldwide</span>. Our expertise in supplier qualification, strategic sourcing and procurement, with specialised focus across India and Asia, helps businesses build transparent, <span className="text-[#8A6F2B] font-semibold">long-term supply chain partnerships</span>.
          </p>
        </div>
      </section>

      <BuyerServiceOffers />

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
                <Icon size={22} className="text-[#8A6F2B]" />
                <div className="font-display text-xl text-[#012D76] mt-6 mb-2">{title}</div>
                <p className="text-sm text-[#3A4759] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comparison" className="py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Direct Sourcing vs EEC</div>
          <h2 className="sr-only">EEC vs Direct Sourcing: A Procurement Team&apos;s Comparison</h2>
          <p className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-10" aria-hidden="true">
            Why mature procurement teams switch from direct sourcing.
          </p>
          <div className="hidden md:block overflow-x-auto border hairline">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#012D76] text-white">
                  <th className="text-left px-6 py-4 font-medium text-xs tracking-wider uppercase">Dimension</th>
                  <th className="text-left px-6 py-4 font-medium text-xs tracking-wider uppercase">Direct Sourcing</th>
                  <th className="text-left px-6 py-4 font-medium text-xs tracking-wider uppercase text-[var(--eec-gold)]">With EEC</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([dim, direct, eec], i) => (
                  <tr key={dim} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"}>
                    <td className="px-6 py-4 font-medium text-[#012D76] border-t hairline">{dim}</td>
                    <td className="px-6 py-4 text-[#3A4759] border-t hairline">{direct}</td>
                    <td className="px-6 py-4 text-[#8A6F2B] font-medium border-t hairline">{eec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-4">
            {COMPARISON.map(([dim, direct, eec]) => (
              <div key={dim} className="border hairline bg-white">
                <div className="bg-[#012D76] text-white px-5 py-3 text-xs font-medium tracking-wider uppercase">{dim}</div>
                <div className="px-5 py-4 border-t hairline">
                  <div className="text-xs font-medium tracking-wider uppercase text-[#6B7280] mb-1">Direct Sourcing</div>
                  <p className="text-sm text-[#3A4759]">{direct}</p>
                </div>
                <div className="px-5 py-4 border-t hairline">
                  <div className="text-xs font-medium tracking-wider uppercase text-[var(--eec-gold)] mb-1">With EEC</div>
                  <p className="text-sm text-[#8A6F2B] font-medium">{eec}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border hairline bg-[#FFFFFF] p-6">
            <p className="text-[#3A4759] text-sm">See how EEC would work for your category.</p>
            <Link href="/buyer-service-request" className="eec-btn-primary" data-testid="compare-cta-buyers">
              Request a Buyer Service <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

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
                <Link href={dashboardHref} className="eec-btn-primary self-start" data-testid="buyer-portal-dashboard">
                  Go to dashboard <ArrowUpRight size={16} />
                </Link>
              ) : (
                <>
                  <Link href="/buyer-service-request" className="eec-btn-primary self-start" data-testid="buyer-portal-brief">
                    Request a Buyer Service <ArrowUpRight size={16} />
                  </Link>
                  <p className="text-sm text-[#3A4759]">
                    <Link href="/login" className="text-[#012D76] hover:underline">Already have an account? Sign in.</Link>
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="border hairline bg-surface p-8">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A6F2B] font-semibold mb-6">SAMPLE BRIEF. ILLUSTRATIVE DATA ONLY.</div>
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

      <section id="certifications" className="py-16 border-t border-b hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-2xl text-[#012D76] tracking-tight font-light mb-3">
            Supplier Compliance Screening for European and Global Buyers
          </h2>
          <p className="text-sm text-[#3A4759] leading-relaxed mb-6">
            EEC screens every supplier against the certification requirements of your destination market before shortlisting. European food buyers typically require BRC/BRCGS, FSSC 22000, FSSAI and IFS Food as a baseline.
          </p>
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#3A4759] font-semibold">Compliance screened for</span>
          <div className="mt-3">
            <CertLogosMarquee names={COMPLIANCE_CERTS} />
          </div>
          <p className="mt-4 text-xs text-[#6B7280]">Certifications are supplier-held. EEC screens and verifies compliance documentation on every supplier before network approval.</p>
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <Link href="/buyer-service-request?service=background-check" className="eec-btn-secondary text-sm">Request a Supplier Background Check</Link>
            <Link href="/for-suppliers#qualification" className="text-sm text-[#012D76] hover:underline">See how suppliers are qualified</Link>
          </div>
        </div>
      </section>

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
                  {a}{link && <> <Link href={link} className="text-[#012D76] hover:underline font-medium">{linkText}.</Link></>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border hairline bg-[#FFFFFF] p-6">
            <p className="text-[#3A4759] text-sm">Ready to discuss your sourcing requirements?</p>
            <Link href="/buyer-service-request" className="eec-btn-primary" data-testid="faq-cta-buyers">
              Request a Buyer Service <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
