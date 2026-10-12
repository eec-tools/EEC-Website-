"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Factory, FileBadge, TrendingUp, Handshake } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CertGrid } from "@/components/CertLogoMarquee";
import SupplierExportSupport from "@/components/SupplierExportSupport";
import NewBadge from "@/components/NewBadge";

const BG = "/images/hero-suppliers.jpg";
// TODO: Replace metalworking image with food/textile/packaged goods production image
const SECONDARY = "/images/hero-suppliers-secondary.jpg";

const BENEFITS = [
  { icon: TrendingUp, title: "Quality, recurring orders", desc: "Designed for long-term sourcing partnerships rather than one-off transactions. EEC connects qualified suppliers with international procurement teams across Europe, the US, the Middle East and Asia through structured programmes and clearly defined sourcing requirements." },
  { icon: Handshake, title: "Direct buyer access", desc: "EEC pre-qualifies you. You meet procurement decision-makers, not category assistants or intermediary agents. Your factory is presented with an EEC audit report, not a cold profile. Buyers span procurement teams across Europe, the US, the Middle East and Asia." },
  { icon: FileBadge, title: "Faster payments", desc: "EEC targets structured payment terms and works to protect suppliers from extended payment cycles that erode working capital. Faster payment terms than typical direct export transactions." },
  { icon: Factory, title: "Capacity planning", desc: "EEC shares buyer programme requirements and indicative volumes in advance, giving suppliers better visibility into pipeline demand than spot-RFQ models." },
];

import { REQS, CERT_CARDS } from "@/constants/categoriesData";

const CERT_WALL = {
  Textiles: ["BSCI", "SEDEX", "GOTS", "OEKO-TEX Standard 100", "OEKO-TEX STEP", "GRS", "ISO 9001", "ISO 14001", "CE", "WRAP", "Higg Index", "SA8000"],
  Food: ["FSSAI", "HACCP", "BRC/BRCGS", "FSSC 22000", "IFS Food", "GlobalG.A.P.", "GRASP", "EU Organic", "NPOP", "Kosher", "Halal", "ASC", "MSC", "amfori BSCI", "EU Health Certificate", "Rainforest Alliance", "Aflatoxin Testing Reports", "Phytosanitary Certificate", "MRL Testing Reports", "SMETA"],
};

const FAQ = [
  ["What is the EEC Supplier Network?", "The EEC Supplier Network is an exclusive ecosystem that connects export-ready manufacturers directly with vetted contract opportunities from procurement teams in North America, Europe, and the Middle East. Rather than competing in an open directory, qualified factories are matched to specific, named buyer requirements across our active sourcing categories."],
  ["Who can apply to join the EEC Supplier Network?", "Manufacturers and producers across the six EEC active categories are welcome to apply. We evaluate suppliers based on manufacturing capability, product quality, export readiness, compliance standards and alignment with buyer requirements. Trading and re-export businesses are not eligible."],
  ["How does EEC qualify suppliers?", "Onboarding into the EEC network follows a structured five-stage qualification pathway, designed to get your factory audit-ready and buyer-visible as efficiently as possible: valid IEC and GST registration; established manufacturing operations with a proven export track record (trading and re-export operations do not qualify); factory audit-readiness, with a BSCI or SEDEX audit scheduled within 90 days of activation; a documented quality management system (ISO 9001 preferred); and demonstrated export experience to North America, Europe, the Middle East, or Asia-Pacific. On completion, your factory receives a full EEC audit report presented directly to buyers, not a passive directory listing."],
  ["Do I need all certifications to apply to EEC?", "No. You do not need every certification at application stage. Factory audit-readiness is what qualifies you. Specifically, willingness to schedule a BSCI or SEDEX audit within 90 days of network activation. EEC provides a certification roadmap during onboarding, aligned to the specific buyer markets your category targets."],
  ["Does joining the EEC Supplier Network guarantee orders?", "No. Joining the EEC Supplier Network does not guarantee purchase orders or contracts. Qualified suppliers may be considered for relevant sourcing opportunities when their products, capabilities and commercial offering align with buyer requirements."],
  ["Which countries and industries does EEC serve?", "EEC's active sourcing categories include Food Commodities, Processed and Packaged Foods, Fresh and Agricultural Products, Healthcare and Hospital Textile Supplies, Home Textiles, Apparel and Hospitality Products, and Eco-Friendly, Sustainable, and Organic Products. We support procurement teams and buyers across the EU, UK, US, Canada, Australia, South Africa, the Middle East, and Asia-Pacific."],
  ["Does EEC work only with suppliers from India and Asia?", "The EEC supplier network is primarily based in India, with verified manufacturers and sourcing partners across Vietnam, Bangladesh, Indonesia, Thailand, Egypt, Kenya, Australia, Peru, Argentina, Turkey, Brazil, and Ecuador. This regional sourcing network enables EEC to identify qualified suppliers that align with specific buyer requirements across multiple product categories."],
  ["What makes EEC different from a B2B marketplace?", "Marketplaces put your factory in a queue, bidding blindly against anonymous competitors on price alone. EEC works differently: as a dedicated consultancy, we bring qualified suppliers targeted, concrete RFQs from named buyers, not open listings. You know who you're quoting, what they need, and why you were matched to the opportunity."],
];

export default function ForSuppliers() {
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref = isAuthed && user.role === "admin" ? "/admin" : isAuthed && user.role === "supplier" ? "/supplier" : "/buyer";

  return (
    <div data-testid="for-suppliers-page">


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
            Join the EEC <span className="text-[#8A6F2B] font-semibold">qualified supplier network</span> and connect with <span className="text-[#8A6F2B] font-semibold">international procurement programmes</span> across food commodities, fresh and agricultural products, processed and packaged foods, healthcare and hospital textile supplies, home textiles, apparel and hospitality products, and eco-friendly, sustainable and organic products.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {isAuthed ? (
              <Link href={dashboardHref} className="eec-btn-primary" data-testid="supplier-cta-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link href="/register?role=supplier" className="eec-btn-primary" data-testid="supplier-cta-apply">
                Join the Supplier Network <ArrowUpRight size={16} />
              </Link>
            )}
            <Link href="#qualification" className="eec-btn-secondary">See qualification requirements</Link>
          </div>
        </div>
      </section>

      <section className="border-b hairline bg-surface py-14 lg:py-16" data-testid="supplier-path-chooser">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Two ways to work with EEC</div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light max-w-3xl">
            Choose the one that fits where your company is today.
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border hairline bg-white p-7 lg:p-8 flex flex-col">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#6B7280] font-semibold">Option A · Supplier Network</div>
              <h3 className="font-display text-2xl text-[#012D76] mt-3">Join the EEC Supplier Network</h3>
              <p className="mt-3 text-sm text-[#3A4759] leading-relaxed">
                For manufacturers ready to be qualified and matched with named buyer requirements. Includes document review and a factory assessment. Trading and re-export businesses are not eligible.
              </p>
              <div className="mt-auto pt-6">
                <Link href="#qualification" className="eec-btn-secondary" data-testid="supplier-path-network">
                  See requirements &amp; apply <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
            <div className="border-2 border-[#C9A23F] bg-[#FDF8EE]/70 p-7 lg:p-8 flex flex-col">
              <div className="flex items-center gap-3">
                <NewBadge />
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#8A6F2B] font-semibold">Option B · Export Support</span>
              </div>
              <h3 className="font-display text-2xl text-[#012D76] mt-3">Check your Export Readiness</h3>
              <p className="mt-3 text-sm text-[#3A4759] leading-relaxed">
                For manufacturers and exporters who want to know how ready they are for international buyers. A desk-based assessment with a readiness score and a 90-day action plan. Separate from the Supplier Network application. Complimentary pilot for the first 10 qualified companies.
              </p>
              <div className="mt-auto pt-6">
                <Link href="#export-readiness" className="eec-btn-primary" data-testid="supplier-path-diagnostic">
                  See the diagnostic <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl space-y-8">
            <p className="text-base lg:text-lg leading-relaxed text-[#3A4759]">
              We maintain <span className="text-[#012D76] font-semibold">dedicated supplier benches</span> for each category. Click a category to see the products EEC sources, the certifications screened and the brief format we use.
            </p>
          </div>
        </div>
      </section>

      <SupplierExportSupport />

      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Why join</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl">
            What Verified Indian Manufacturers Gain from the EEC Supplier Network
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border hairline p-8 bg-surface">
                <Icon size={22} className="text-[#8A6F2B]" />
                <div className="font-display text-xl text-[#012D76] mt-6 mb-2">{title}</div>
                <p className="text-sm text-[#3A4759] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#3A4759]">
            <Link href="/for-buyers" className="text-[#012D76] hover:underline">See what buyers receive from EEC</Link>
          </p>
        </div>
      </section>

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
              <Link href={dashboardHref} className="eec-btn-primary mt-8" data-testid="supplier-cta-req-dashboard">
                Go to dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link href="/register?role=supplier" className="eec-btn-primary mt-8" data-testid="supplier-cta-req-apply">
                Join the Supplier Network <ArrowUpRight size={16} />
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
                  <span className="font-display text-[#8A6F2B] text-sm">0{i + 1}</span>
                  <span className="text-[#012D76]/90">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative">
            <img src={SECONDARY} alt="Fresh produce and agricultural products from EEC supplier sourcing categories" loading="lazy" decoding="async" width="1200" height="900" className="w-full h-[480px] object-cover" />
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
                  <span className="font-display text-3xl text-[#8A6F2B]">{(i + 1).toString().padStart(2, "0")}</span>
                  <div className="pt-2">
                    <div className="text-[#012D76] text-sm leading-relaxed">{s}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="certifications" className="py-20 lg:py-24 border-t hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Certification requirements</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-6">
            Certification Requirements by Product Category: What EEC Screens For
          </h2>
          <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-8">
            Required certifications vary by product category. You do not need every certification at application stage. Factory audit-readiness is what qualifies you. EEC can guide approved suppliers through the certification roadmap during onboarding.
          </p>
          <div className="space-y-14">
            {CERT_CARDS.map(({ cat, certs, note }) => (
              <div key={cat}>
                <h3 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light mb-1">{cat}</h3>
                {note && <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{note}</p>}
                <CertGrid names={certs} />
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-[#6B7280]">All suppliers additionally require IEC and GST registration.</p>

          <div className="mt-14">
            <div className="overline mb-3">Standards we screen for</div>
            <p className="text-[#3A4759] leading-relaxed max-w-3xl mb-8">
              Certifications are supplier-held and screened during qualification, grouped here by the two broad categories above.
            </p>
            <div className="space-y-14">
              {Object.entries(CERT_WALL).map(([group, certs]) => (
                <div key={group}>
                  <h3 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light mb-4">{group}</h3>
                  <CertGrid names={certs} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                    <>{a} <Link href={link} className="text-[#012D76] hover:underline font-medium">Learn more.</Link></>
                  ) : a}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border hairline bg-[#FFFFFF] p-6">
            <p className="text-[#3A4759] text-sm">Ready to apply? Start your factory profile now.</p>
            <Link href="/register?role=supplier" className="eec-btn-primary" data-testid="faq-cta-suppliers">
              Join the Supplier Network <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
