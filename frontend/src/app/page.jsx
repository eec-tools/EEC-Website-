"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronRight, Quote, Star, BarChart3, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { COMPANY } from "@/constants/company";
import HomeServices from "@/components/HomeServices";
import ServicesIntro from "@/components/ServicesIntro";
import FaqAccordion from "@/components/FaqAccordion";

const HERO_IMG = "/images/hero-container-ship.jpg";

const STATS = [
  { value: 20, suffix: "+", label: "Years of Founder Experience" },
  { value: 70, suffix: "+", label: "Signed Suppliers" },
  { value: 13, suffix: "+", label: "Countries" },
];

const PROCESS_STEPS = [
  { n: "01", title: "Discovery Call", desc: "A free 20-minute call to map your category, target landed cost, order volume, compliance requirements and timelines. No commitment required." },
  { n: "02", title: "Sourcing Sprint", desc: "We shortlist 5 to 8 vetted suppliers, coordinate samples, run negotiations and deliver a decision-ready sourcing memo within 21 business days, subject to supplier response and category scope." },
  { n: "03", title: "Negotiate and Sample", desc: "We negotiate MOQ, payment terms and lead times and coordinate sample QC and arrange third-party pre-shipment inspections against an agreed Acceptable Quality Level (AQL)." },
  { n: "04", title: "Ship and Optimise", desc: "We coordinate logistics, customs clearance and post-shipment quality control while tracking landed cost components across each shipment cycle." },
];

const TESTIMONIALS = [
  {
    quote: "It has been a privilege to partner with EEC. Known for our high-quality agricultural products, we have found our collaboration with your team to be truly delightful. Your professionalism, coupled with a genuinely friendly approach, has turned every collaboration into a thriving success and a joyful experience. This relationship has notably expanded our client network and enriched our market presence. We are deeply thankful for your unwavering support and the opportunities it has brought us. Looking ahead, we're excited about continuing this successful journey and exploring new horizons together. Thank you for making every interaction so rewarding!",
    attribution: "Vegetable Supplier, Egypt",
    initials: "KF",
  },
  {
    quote: "I wanted to share some exciting news about our collaboration with EEC. Their supportive team has offered to connect us with big retailers in the industry, which presents a fantastic opportunity for us to expand our reach and grow our business.",
    attribution: "Apparel Manufacturer, India",
    initials: "AM",
  },
  {
    quote: "EEC is a fantastic company to work with. The team excels at understanding buyer requirements from day one, clearly communicating these needs to the factories at every stage. They are diligent in ensuring that both the buyer's and factory's needs are met with a well-thought-out plan and seamless execution. Their reliability and friendly approach make them a pleasure to collaborate with.",
    attribution: "Home Textile Supplier, India",
    initials: "HT",
  },
  {
    quote: "We established a relationship with EEC two years ago, and they have left a deep impression on us. The company has played an indispensable role in facilitating our trade with the end customer. They have demonstrated outstanding professionalism across all stages of cooperation: smooth two-way communication, efficient handling of order formalities, and timely solutions to all unexpected issues. Equipped with solid industry expertise and an attentive working style, they have put forward practical proposals that balance both parties' needs and have greatly simplified our entire transaction process. We highly recognize their rigorous and devoted service. We sincerely wish them continuous growth, a thriving business, and greater achievements in their future endeavors. Additionally, we are looking forward to further potential cooperation with them in the future.",
    attribution: "Outdoor Textiles Supplier, China",
    initials: "OT",
  },
  {
    quote: "Our experience working with EEC has been highly professional and result-oriented. Their market knowledge, sourcing expertise, and strong buyer network have helped create valuable business opportunities for our company. We particularly appreciate EEC's support in facilitating business discussions with a leading discount retailer in Germany. Throughout the engagement, their team demonstrated excellent communication, commitment, and a proactive approach to building successful partnerships. We would confidently recommend EEC to companies seeking reliable global sourcing and business development support.",
    attribution: "Peanut Butter Supplier, India",
    initials: "PB",
  },
  {
    quote: "We have had a positive experience working with EEC. Their team is professional, reliable, and responsive, making communication and project coordination smooth and efficient. We value our partnership and look forward to working together in the future.",
    attribution: "Textile Supplier, Hong Kong",
    initials: "TS",
  },
];

const HOME_CATEGORIES = [
  { id: "food", name: "Food Commodities", tagline: "Rice, Sugar, Pulses, Lentils, Beans, Seeds, Salt, Edible Oils, Spices", image: "/images/categories/food-commodities.jpg", cta: "Source food commodities", alt: "Rice, spices, pulses, edible oils and whole spices laid out for food commodity sourcing" },
  { id: "processed", name: "Processed and Packaged Foods", tagline: "Instant Noodles, Biscuits, Snacks, Peanut Butter, Sauces, Beverages, Frozen Foods, Ready Meals, Private Label Foods", image: "/images/categories/processed-packaged-foods.jpg", cta: "Source processed foods", alt: "Assorted packaged snacks and confectionery bars for processed and packaged food sourcing" },
  { id: "fresh", name: "Fresh and Agricultural Products", tagline: "Fruits, Vegetables, Frozen Fruits, Frozen Vegetables, Herbs, Agricultural Produce, Organic Produce", image: "/images/categories/fresh-agricultural-produce.jpg", cta: "Source fresh produce", alt: "Crates of fresh fruits, vegetables and organic produce including peppers, tomatoes, carrots and greens" },
  { id: "healthcare", name: "Healthcare and Hospital Textile Supplies", tagline: "Hospital Textiles, Patient Gowns, Scrubs, Surgical Drapes, Hospital Bed Linen, Institutional Uniforms, Curtains, Healthcare Procurement Products", image: "/images/hero-image.jpeg", cta: "Source healthcare textiles", alt: "Hospital textiles, PPE and medical linen sourced from certified Indian manufacturers" },
  { id: "home-textile", name: "Home Textile, Apparel and Hospitality Products", tagline: "Bed Linen, Hotel Linen, Towels, Bathrobes, Curtains, Uniforms, Home Textiles, Home Furnishings, Hotel Textiles, Hospitality Products", image: "/images/categories/home-textile-apparel-hospitality.jpg", cta: "Source home textiles", alt: "Bed linen, towels, uniforms and hotel textiles for home textile and hospitality sourcing" },
  { id: "eco", name: "Eco-Friendly, Sustainable and Organic Products", tagline: "Organic Foods, Organic Textiles, Sustainable Textiles, Bamboo Products, Coconut-based Products, Areca Leaf Products, Compostable Products, Sustainable Packaging Solutions, Fair Trade Products, Green Alternatives", image: "/images/categories/eco-friendly-sustainable-organic.jpg", cta: "Source eco-friendly products", alt: "Biodegradable packaging, organic textiles and green alternative products" },
];

const FAQ = [
  { q: "What is Elan Exports Consultancy?", a: `Elan Exports Consultancy (EEC) is a Singapore-headquartered global sourcing consultancy connecting buyers with verified manufacturers worldwide, with deep specialisation across India and Southeast Asia. Built on 20 years of founder experience in international trade, EEC operates on a transparent commercial model with predictable shipments, functioning as an embedded sourcing arm for buyers rather than a transactional marketplace.` },
  { q: "What countries does EEC source from?", a: "EEC sources from India, Asia and select global markets. India remains the primary sourcing market across food commodities, textiles, fresh produce, processed foods, hospital textiles and eco-friendly products. EEC also works with verified manufacturers in Vietnam, Bangladesh, Indonesia, Thailand and other countries based on category requirements. Every supplier in the network is verified before any RFQ is deployed to a buyer." },
  { q: "How is EEC different from a sourcing marketplace?", a: "Unlike traditional sourcing marketplaces, EEC provides personalised sourcing and procurement consultancy. Suppliers are recommended based on their capabilities, quality and suitability for buyer requirements, not commercial incentives." },
  { q: "What is landed cost, and how does EEC model it?", a: "Landed cost is the total cost of a product at the destination warehouse, including factory price (FOB), freight, insurance, import duties, customs clearance and last-mile delivery. EEC provides transparent landed cost comparisons for sourcing projects before the buyer commits to a supplier. This gives procurement teams an accurate, comparable basis for supplier decisions across categories and geographies." },
  { q: "How does EEC price its services?", a: "EEC offers flexible pricing based on the nature of each engagement, including buyer consultancy fees, transaction-based arrangements and specialised export advisory services." },
];

export default function Home() {
  const [categories, setCategories] = useState(HOME_CATEGORIES);
  const { user } = useAuth();
  const isAuthed = user && user.user_id;
  const dashboardHref =
    isAuthed && user.role === "admin" ? "/admin"
    : isAuthed && user.role === "supplier" ? "/supplier"
    : "/buyer";

  useEffect(() => {
    api.get("/categories").then(({ data }) => {
      if (Array.isArray(data) && data.length) setCategories(data);
    }).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQ.map(({ q, a }) => ({
              "@type": "Question",
              "name": q,
              "acceptedAnswer": { "@type": "Answer", "text": a }
            }))
          })
        }}
      />
      <ServicesIntro />
      <section className="relative overflow-hidden grain pt-6 lg:pt-10" data-testid="hero-section">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-[rgba(201,162,75,0.06)] to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-5 lg:px-10 pb-20 lg:pb-28 relative">
          <HomeServices />
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <span className="overline">Singapore Headquartered</span>
                <span className="overline">India operations</span>
              </div>
              <h1 className="sr-only">India Sourcing and Procurement Consultancy for Global Buyers</h1>
              <p className="font-display text-[44px] leading-[1.02] sm:text-6xl lg:text-7xl mt-6 text-[#012D76] tracking-tight" aria-hidden="true">
                Cut sourcing risk,<br />
                <em className="italic font-normal text-[#012D76]/90">landed cost, and</em><br />
                supplier uncertainty.
              </p>
              <div className="mt-8 text-base lg:text-lg text-[#3A4759] leading-relaxed max-w-xl space-y-5">
                <p>
                  EEC is a Singapore headquartered global sourcing consultancy connecting buyers with verified manufacturing partners{" "}
                  <span className="text-[#8A6F2B] font-medium">across the world</span>.
                </p>
                <p>
                  While our sourcing{" "}
                  <span className="text-[#8A6F2B] font-medium">expertise is rooted in India and Asia</span>, our trusted supplier network spans{" "}
                  <span className="text-[#8A6F2B] font-medium">global markets</span>, enabling us to deliver{" "}
                  <span className="text-[#8A6F2B] font-medium">transparent commercial terms, predictable shipments,</span> and{" "}
                  <span className="text-[#8A6F2B] font-medium">reliable sourcing solutions</span>.
                </p>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center">

                <div className="flex items-center gap-4 sm:pr-8">
                  <img src="/images/icons/handshake.png" alt="" width="239" height="272" className="w-[60px] h-[60px] flex-shrink-0" aria-hidden="true"/>
                  <span className="text-sm font-bold text-[#0D1B2A] leading-snug">
                    Transparent<br/>Commercial Terms
                  </span>
                </div>

                <div className="hidden sm:block w-px h-14 bg-[#0D1B2A]/20 flex-shrink-0" aria-hidden="true"/>
                <div className="sm:hidden h-px w-52 bg-[#0D1B2A]/20 my-4" aria-hidden="true"/>

                <div className="flex items-center gap-4 sm:px-8">
                  <img src="/images/icons/ship.png" alt="" width="251" height="253" className="w-[60px] h-[60px] flex-shrink-0" aria-hidden="true"/>
                  <span className="text-sm font-bold text-[#0D1B2A] leading-snug">
                    Predictable<br/>Shipments
                  </span>
                </div>

                <div className="hidden sm:block w-px h-14 bg-[#0D1B2A]/20 flex-shrink-0" aria-hidden="true"/>
                <div className="sm:hidden h-px w-52 bg-[#0D1B2A]/20 my-4" aria-hidden="true"/>

                <div className="flex items-center gap-4 sm:pl-8">
                  <img src="/images/icons/shield.png" alt="" width="233" height="245" className="w-[60px] h-[60px] flex-shrink-0" aria-hidden="true"/>
                  <span className="text-sm font-bold text-[#0D1B2A] leading-snug">
                    Reliable<br/>Sourcing Solutions
                  </span>
                </div>

              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                {isAuthed ? (
                  <>
                    <Link href={dashboardHref} className="eec-btn-primary group" data-testid="hero-cta-dashboard">
                      Go to dashboard <ArrowUpRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                    <Link href="/buyer-service-request" className="eec-btn-secondary" data-testid="hero-cta-new-brief">
                      Request a Buyer Service <ChevronRight size={16} />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/buyer-service-request" className="eec-btn-primary group" data-testid="hero-cta-buyer">
                      Request a Buyer Service <ArrowUpRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                    <Link href="/for-buyers#buyer-services" className="eec-btn-secondary" data-testid="hero-cta-supplier">
                      Explore Buyer Services <ChevronRight size={16} />
                    </Link>
                  </>
                )}
              </div>
              <p className="mt-8 text-xs text-[#6B7280] max-w-md leading-relaxed">
                {`Singapore HQ | Incorporated ${COMPANY.incorporationMonthYear} | ${COMPANY.supplierCountClaim} | India and Asia operations`}
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-32 h-32 border border-[#C9A23F]/50 pointer-events-none" />
                <img
                  alt="Shipping containers representing the EEC India and Asia sourcing network"
                  className="w-full h-[420px] lg:h-[540px] object-cover grayscale-[10%]"
                  src={HERO_IMG}
                  width="1400"
                  height="1600"
                  decoding="async"
                  fetchPriority="high"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-[#FFFFFF]/95 backdrop-blur-md p-5 border-l-2 border-[#C9A23F]">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8A6F2B]">A buyer-first sourcing desk</p>
                  <p className="mt-2 font-display text-xl text-[#012D76] leading-tight">
                    Vetted suppliers. Transparent quotations. Supply chains you can plan around.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatsSection />

      <section className="py-20 lg:py-28" data-testid="categories-section">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <span className="overline">What we source</span>
              <h2 className="sr-only">Product Categories We Source Across India and Asia</h2>
              <p className="font-display text-4xl lg:text-5xl text-[#012D76] mt-5 max-w-2xl tracking-tight" aria-hidden="true">
                Six categories. <em className="italic font-normal">No marketplace clutter.</em>
              </p>
            </div>
            <p className="max-w-md text-sm lg:text-base text-[#3A4759] leading-relaxed">
              We take a focused approach to procurement and sourcing. Every supplier in our network undergoes due diligence and ongoing evaluation, ensuring global buyers have access to reliable manufacturers, transparent commercial practices and dependable supply chains across India and Asia.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E5EBF2]">
            {categories.map((c, i) => (
              <Link key={c.id} href="/categories" className="group bg-[#FFFFFF] hover:bg-[#F5F9FC] transition-colors duration-500 p-7 lg:p-9" data-testid={`category-card-${c.id}`}>
                <div className="relative aspect-[4/3] overflow-hidden mb-6 bg-[#EFF4F9]">
                  <Image
                    src={c.image}
                    alt={c.alt || c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover grayscale-[10%] group-hover:scale-[1.03] transition-transform duration-700"
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl text-[#012D76]">{c.name}</h3>
                  <span className="text-xs text-[#6B7280] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="mt-3 text-sm text-[#3A4759] leading-relaxed">{c.tagline}</p>
                <span className="inline-flex items-center gap-1.5 mt-6 text-sm text-[#012D76] font-medium">
                  {c.cta || `Source ${c.name.toLowerCase()}`} →
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#3A4759]">
            <Link href="/categories" className="text-[#012D76] hover:underline">Explore all six categories</Link>
          </p>
        </div>
      </section>

      <section className="bg-[#012D76] text-[#FFFFFF] py-20 lg:py-28 grain" data-testid="process-section">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 text-[11px] uppercase tracking-[0.22em] text-white/80 bg-white/[0.03]">
              <span className="h-1 w-1 rounded-full bg-[#C9A23F]" />
              How it works
            </span>
            <h2 className="sr-only">How the EEC Sourcing Process Works</h2>
            <p className="font-display text-4xl lg:text-5xl mt-5 tracking-tight" aria-hidden="true">
              A clear, <em className="italic font-normal text-[var(--eec-gold)]">four-step</em> engagement.
            </p>
          </div>
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {PROCESS_STEPS.map((s) => (
              <div key={s.n} className="bg-[#012D76] p-8 lg:p-10" data-testid={`process-step-${s.n}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl text-[var(--eec-gold)] italic">{s.n}</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">Step</span>
                </div>
                <h3 className="font-display text-2xl mt-8">{s.title}</h3>
                <p className="mt-4 text-sm text-white/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col sm:flex-row gap-3">
            <Link href="/buyer-service-request" className="inline-flex items-center justify-center gap-2 bg-[#C9A23F] text-[#012D76] hover:bg-[#DBB85A] h-14 px-6 text-sm font-medium transition-colors" data-testid="process-cta-book">
              Request a Buyer Service <ArrowUpRight size={16} />
            </Link>
            <Link href="/for-buyers" className="inline-flex items-center justify-center gap-2 text-[#FFFFFF] hover:bg-white/10 h-14 px-6 text-sm font-medium transition-colors">
              See the buyer playbook
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/60">
            <Link href="/services" className="hover:text-white/90 transition-colors">Compare Scout, Engage and Embed</Link>
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 border-t hairline bg-surface">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="relative overflow-hidden rounded-2xl border hairline bg-gradient-to-br from-[#EEF3FA] to-[#F7FAFD]">
            <div className="grid md:grid-cols-2 md:divide-x divide-[#012D76]/10">
              <div className="p-8 lg:p-12">
                <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-6 w-6 text-[#012D76]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl text-[#012D76] mt-6">Compare with confidence</h3>
                <p className="text-[#3A4759] mt-3 text-sm leading-relaxed max-w-sm">See how EEC compares to direct sourcing in quality, cost, and reliability.</p>
                <Link href="/for-buyers#comparison" className="inline-flex items-center gap-2 mt-6 text-[#012D76] hover:underline font-medium">See how EEC compares to direct sourcing <ArrowUpRight size={16} /></Link>
              </div>
              <div className="p-8 lg:p-12">
                <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-[#012D76]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl text-[#012D76] mt-6">Engagement models that fit you</h3>
                <p className="text-[#3A4759] mt-3 text-sm leading-relaxed max-w-sm">EEC offers three engagement models: Scout, Engage, and Embed, each scoped and priced at the discovery call.</p>
                <Link href="/services" className="inline-flex items-center gap-2 mt-6 text-[#012D76] hover:underline font-medium">See all engagement models <ArrowUpRight size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-testid="testimonials-section" aria-label="Supplier testimonials">
        <TestimonialsBlock />
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          {isAuthed ? (
            <div className="border hairline bg-[#FFFFFF] p-10 lg:p-14 text-center" data-testid="closing-cta-authed">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8A6F2B]">Welcome back, {user.name?.split(" ")[0]}</p>
              <h3 className="font-display text-3xl lg:text-4xl text-[#012D76] mt-4 tracking-tight max-w-2xl mx-auto">Pick up where you left off.</h3>
              <p className="text-[#3A4759] mt-4 text-sm leading-relaxed max-w-xl mx-auto">Track your active briefs, supplier applications, documents and shipment milestones.</p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link href={dashboardHref} className="eec-btn-primary" data-testid="closing-cta-dashboard">Go to dashboard <ArrowUpRight size={16} /></Link>
                {user.role === "buyer" && <Link href="/buyer/intake" className="eec-btn-secondary" data-testid="closing-cta-new-brief">Submit another brief <ChevronRight size={16} /></Link>}
                {user.role === "supplier" && <Link href="/supplier/apply" className="eec-btn-secondary" data-testid="closing-cta-new-application">Submit another application <ChevronRight size={16} /></Link>}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-px bg-[#E5EBF2]">
              <Link href="/buyer-service-request" className="group bg-[#FFFFFF] p-10 lg:p-14 hover:bg-[#F5F9FC] transition-colors duration-500" data-testid="closing-cta-buyer">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A6F2B]">For Buyers</p>
                <h3 className="font-display text-3xl lg:text-4xl text-[#012D76] mt-4 tracking-tight">Request a buyer service.</h3>
                <p className="text-[#3A4759] mt-4 text-sm leading-relaxed max-w-md">No commitment required. EEC maps your category, target landed cost, compliance requirements and a realistic 90-day sourcing plan.</p>
                <span className="inline-flex items-center gap-2 mt-8 text-[#012D76] font-medium">Request now <ArrowUpRight size={14} /></span>
              </Link>
              <Link href="/register?role=supplier" className="group bg-[#FFFFFF] p-10 lg:p-14 hover:bg-[#F5F9FC] transition-colors duration-500" data-testid="closing-cta-supplier">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A6F2B]">For Suppliers</p>
                <h3 className="font-display text-3xl lg:text-4xl text-[#012D76] mt-4 tracking-tight">Join the EEC Supplier Network.</h3>
                <p className="text-[#3A4759] mt-4 text-sm leading-relaxed max-w-md">Structured sourcing briefs, defined payment schedules and recurring export programmes. Not one-off spot RFQs.</p>
                <span className="inline-flex items-center gap-2 mt-8 text-[#012D76] font-medium">Join the network <ArrowUpRight size={14} /></span>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 lg:py-28 border-t hairline bg-surface">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="font-display text-4xl lg:text-5xl text-[#012D76] tracking-tight mb-12">
            Frequently Asked Questions About EEC Sourcing and Procurement Services
          </h2>
          <FaqAccordion idPrefix="home-faq" items={FAQ.map(({ q, a, link, linkText }) => ({
              q,
              a: <>{a}{link && <> <Link href={link} className="text-[#012D76] hover:underline font-medium">{linkText}.</Link></>}</>,
            }))} />
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border hairline bg-[#FFFFFF] p-6">
            <p className="text-[#3A4759] text-sm">Still have questions? Tell us what you need.</p>
            <Link href="/buyer-service-request" className="eec-btn-primary" data-testid="faq-cta">
              Request a Buyer Service <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function TestimonialWallCard({ t }) {
  return (
    <div className="shrink-0 w-[360px] sm:w-[400px] bg-[#F6F6FA] rounded-2xl p-5 lg:p-6 flex flex-col gap-3">
      <Quote size={32} className="text-[#8A6F2B]" aria-hidden="true" />
      <p className="text-sm text-[#3A4759] leading-relaxed flex-1">
        {t.quote}
      </p>
      <div className="flex items-center gap-3 pt-1">
        <div className="w-9 h-9 rounded-full bg-[#012D76] flex items-center justify-center shrink-0">
          <span className="text-[var(--eec-gold)] font-display text-xs font-semibold">{t.initials}</span>
        </div>
        <p className="text-sm font-semibold text-[#012D76]">{t.attribution}</p>
      </div>
    </div>
  );
}

function TestimonialsBlock() {
  const cards = [...TESTIMONIALS, ...TESTIMONIALS];

  const edgeMask = {
    maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
  };

  return (
    <div className="bg-[#012D76] py-6 lg:py-8">
      <div className="mx-auto max-w-7xl px-2 lg:px-3">
        <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] px-5 lg:px-8 py-8 lg:py-10 shadow-[0_32px_80px_-20px_rgba(1,45,118,0.2)]">
          <div className="text-center mb-6 lg:mb-8">
            <span className="inline-flex items-center gap-2 bg-[#012D76] rounded-full px-4 py-2 mb-6">
              <Star size={13} className="text-[var(--eec-gold)]" fill="currentColor" aria-hidden="true" />
              <span className="text-white text-xs font-medium tracking-wide">Trusted by suppliers and buyers worldwide</span>
            </span>
            <h2 className="font-display text-3xl lg:text-4xl text-[#012D76] tracking-tight">
              Words of praise from our <em className="italic font-normal text-[#8A6F2B]">global network.</em>
            </h2>
          </div>
          <div className="eec-tmarquee-row overflow-hidden" style={edgeMask}>
            <div className="animate-testimonials-ltr flex gap-5 items-stretch" style={{ width: "max-content" }}>
              {cards.map((t, i) => <TestimonialWallCard key={i} t={t} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, suffix, label, start }) {
  const [count, setCount] = useState(value);

  useEffect(() => {
    if (!start) return;
    const duration = 1800;
    let raf;
    let startTime;
    const tick = (t) => {
      if (startTime === undefined) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setCount(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value]);

  return (
    <div className="text-center">
      <div className="font-display text-5xl lg:text-6xl text-[#012D76] tracking-tight tabular-nums">
        {count}{suffix}
      </div>
      <p className="mt-3 text-sm lg:text-base text-[#3A4759] leading-relaxed">{label}</p>
    </div>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  return (
    <section ref={ref} className="py-20 lg:py-28 border-t hairline" aria-label="EEC by the numbers">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
          {STATS.map((s) => (
            <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} start={started} />
          ))}
        </div>
      </div>
    </section>
  );
}
