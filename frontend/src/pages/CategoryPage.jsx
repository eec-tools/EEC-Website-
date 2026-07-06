import React from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import Seo from "@/components/Seo";
import { CertGrid } from "@/components/CertLogoMarquee";
import { IMAGE_DIMENSIONS } from "@/constants/imageDimensions";
import { fallbackCategories, FAQ } from "@/pages/Categories";
import { CERT_CARDS, REQS } from "@/pages/ForSuppliers";

const GEOGRAPHY_NOTE =
  "India is EEC's primary sourcing base for this category. EEC also maintains a smaller, audited manufacturer base across Vietnam, Bangladesh, Indonesia and Thailand, used selectively where a category requires specific technical capability.";

export default function CategoryPage() {
  const { slug } = useParams();
  const category = fallbackCategories.find((c) => (c.slug || c.anchor || c.id) === slug);

  if (!category) return <Navigate to="/categories" replace />;

  const certEntry = CERT_CARDS.find((c) => c.cat === category.name);
  const related = fallbackCategories.filter((c) => c.id !== category.id).slice(0, 3);
  const canonical = `https://eectrade.com/categories/${slug}`;

  return (
    <div data-testid="category-page">
      <Seo
        title={`${category.name} Sourcing | Verified Manufacturers | EEC`}
        description={category.body}
        canonical={canonical}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "Categories", item: "https://eectrade.com/categories" },
              { "@type": "ListItem", position: 3, name: category.name, item: canonical },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${category.name} Sourcing`,
            description: category.body,
            provider: { "@type": "Organization", name: "Elan Exports Consultancy", url: "https://eectrade.com" },
            areaServed: ["Europe", "United States", "Middle East", "Asia-Pacific"],
            url: canonical,
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

      <div className="border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center gap-2 text-sm text-[#6B7280]">
          <Link to="/" className="hover:text-[#012D76]">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link to="/categories" className="hover:text-[#012D76]">Categories</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="text-[#012D76] font-medium">{category.name}</span>
        </div>
      </div>

      <section className="border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="overline mb-4">Category</div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-light text-[#012D76] mb-4">
              {category.name}
            </h1>
            <p className="text-[#3A4759] text-lg leading-relaxed max-w-2xl">{category.tagline}</p>
            <p className="mt-4 text-[#3A4759] leading-relaxed max-w-2xl">{category.body}</p>
            <Link to="/buyer/intake" className="eec-btn-primary mt-8 inline-flex" data-testid="category-cta-intake">
              {category.cta || `Source ${category.name.toLowerCase()}`} <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="lg:col-span-5">
            <img
              src={category.image}
              alt={category.alt || category.name}
              loading="eager"
              decoding="async"
              width={IMAGE_DIMENSIONS[category.image]?.width}
              height={IMAGE_DIMENSIONS[category.image]?.height}
              className="w-full h-[360px] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 border-b hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Sourcing geography</div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light mb-4">
            Where EEC Sources {category.name}
          </h2>
          <p className="text-[#3A4759] leading-relaxed max-w-3xl">{GEOGRAPHY_NOTE}</p>
        </div>
      </section>

      {certEntry && (
        <section className="py-16 lg:py-20 border-b hairline">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="overline mb-3">Certification requirements</div>
            <h2 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light mb-1">
              What EEC Screens For in {category.name}
            </h2>
            {certEntry.note && <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{certEntry.note}</p>}
            <div className="mt-4">
              <CertGrid names={certEntry.certs} />
            </div>
          </div>
        </section>
      )}

      <section className="py-16 lg:py-20 border-b hairline bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Supplier vetting</div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light mb-6">
            How EEC Qualifies {category.name} Suppliers
          </h2>
          <div className="border hairline">
            {REQS.map((r, i) => (
              <div key={r} className={`p-6 flex items-start gap-4 ${i !== 0 ? "border-t hairline" : ""}`}>
                <span className="font-display text-[#8A6F2B] text-sm">0{i + 1}</span>
                <span className="text-[#012D76]/90">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light mb-8">
            Frequently asked questions about EEC sourcing categories
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

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">Related categories</div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#012D76] tracking-tight font-light mb-8">
            Explore Adjacent Sourcing Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((c) => (
              <Link
                key={c.id}
                to={`/categories/${c.slug || c.anchor || c.id}`}
                className="border hairline p-6 hover:border-[#8A6F2B]/60 transition-colors"
                data-testid={`related-category-${c.id}`}
              >
                <div className="font-display text-lg text-[#012D76] tracking-tight mb-2">{c.name}</div>
                <p className="text-sm text-[#3A4759] leading-relaxed">{c.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
