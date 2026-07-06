import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import Seo from "@/components/Seo";
import { IMAGE_DIMENSIONS } from "@/constants/imageDimensions";

export const fallbackCategories = [
  {
    id: "food",
    anchor: "food-commodities",
    slug: "food-commodities",
    name: "Food Commodities",
    tagline: "Rice, Sugar, Pulses, Lentils, Beans, Seeds, Salt, Edible Oils, Spices",
    image: "/images/categories/food-commodities.jpg",
    alt: "Rice, spices, pulses, edible oils and whole spices laid out for food commodity sourcing",
    cta: "Source food commodities",
    // NOTE: EU Health Certificate and Rainforest Alliance don't map cleanly to an existing category (most
    // relevant to frozen food / dried fruit sub-segments). Folded into Food Commodities for now — flag for
    // manual review on whether these warrant their own category longer-term.
    body: "EEC sources rice, sugar, pulses, edible oils and spices from manufacturers screened for FSSAI registration, BRC/BRCGS and amfori BSCI certification. HACCP certification is screened as a baseline requirement, with Aflatoxin testing reports, EU Health Certificates and Rainforest Alliance certification coordinated where required by the destination market.",
  },
  {
    id: "processed",
    anchor: "processed-packaged-foods",
    slug: "processed-packaged-foods",
    name: "Processed and Packaged Foods",
    tagline: "Instant Noodles, Biscuits, Snacks, Peanut Butter, Sauces, Beverages, Frozen Foods, Ready Meals, Private Label Foods",
    image: "/images/categories/processed-packaged-foods.jpg",
    alt: "Assorted packaged snacks and confectionery bars for processed and packaged food sourcing",
    cta: "Source processed foods",
    body: "EEC sources snacks, beverages, frozen foods and ready meals from manufacturers screened for BRC/BRCGS, FSSC 22000 and amfori BSCI certification. IFS Food certification is required for suppliers serving German and French buyers, with Aflatoxin testing reports coordinated where required.",
  },
  {
    id: "fresh",
    anchor: "fresh-agricultural",
    slug: "fresh-agricultural",
    name: "Fresh and Agricultural Products",
    tagline: "Fruits, Vegetables, Frozen Fruits, Frozen Vegetables, Herbs, Agricultural Produce, Organic Produce",
    image: "/images/categories/fresh-agricultural-produce.jpg",
    alt: "Crates of fresh fruits, vegetables and organic produce including peppers, tomatoes, carrots and greens",
    cta: "Source fresh produce",
    body: "EEC sources fruits, vegetables and organic produce from farms screened for GlobalG.A.P., GRASP and amfori BSCI certification. Phytosanitary certificates and MRL testing reports are coordinated where required by the destination market.",
  },
  {
    id: "healthcare",
    anchor: "healthcare-hospital",
    slug: "healthcare-hospital",
    name: "Healthcare and Hospital Textile Supplies",
    tagline: "Hospital Textiles, Patient Gowns, Scrubs, Surgical Drapes, Hospital Bed Linen, Institutional Uniforms, Curtains, Healthcare Procurement Products",
    image: "/images/categories/healthcare-hospital-textiles.jpg",
    alt: "Hospital gowns, scrubs, PPE, bed linen, towels and institutional uniforms in blue and teal",
    cta: "Source healthcare textiles",
    body: "EEC sources hospital textiles, PPE, medical linen and non-regulated consumables from manufacturers screened for ISO 9001, OEKO-TEX Standard 100 and BSCI compliance. Medical devices, pharmaceuticals and regulated clinical products are outside EEC scope.",
  },
  {
    id: "home-textile",
    anchor: "home-textile-hospitality",
    slug: "home-textile-hospitality",
    name: "Home Textile, Apparel and Hospitality Products",
    tagline: "Bed Linen, Hotel Linen, Towels, Bathrobes, Curtains, Uniforms, Home Textiles, Home Furnishings, Hotel Textiles, Hospitality Products",
    image: "/images/categories/home-textile-apparel-hospitality.jpg",
    alt: "Bed linen, towels, uniforms and hotel textiles for home textile and hospitality sourcing",
    cta: "Source home textiles",
    body: "EEC sources bed linen, towels, uniforms and hotel textiles from manufacturers screened for BSCI and/or SEDEX audit compliance. GOTS and OEKO-TEX STEP certification is available for organic and sustainable textile requirements.",
  },
  {
    id: "eco",
    anchor: "eco-friendly-sustainable",
    slug: "eco-friendly-sustainable",
    name: "Eco-Friendly, Sustainable and Organic Products",
    tagline: "Organic Foods, Organic Textiles, Sustainable Textiles, Bamboo Products, Coconut-based Products, Areca Leaf Products, Compostable Products, Sustainable Packaging Solutions, Fair Trade Products, Green Alternatives",
    image: "/images/categories/eco-friendly-sustainable-organic.jpg",
    alt: "Biodegradable packaging, organic textiles and green alternative products",
    cta: "Source eco-friendly products",
    body: "EEC sources biodegradable packaging, organic textiles and green alternatives from manufacturers screened for GOTS certification and EU Organic / NPOP equivalence.",
  },
];

export const FAQ = [
  { q: "What product categories does EEC source?", a: "EEC operates six active sourcing desks. Food Commodities covers rice, sugar, pulses, edible oils and spices. Processed and Packaged Foods covers snacks, beverages, frozen foods and ready meals. Fresh and Agricultural Products covers fruits, vegetables and organic produce. Healthcare and Hospital Textile Supplies covers patient gowns, scrubs, surgical drapes, hospital bed linen and institutional uniforms. Home Textile, Apparel and Hospitality Products covers bed linen, towels, uniforms and hotel textiles. Eco-Friendly, Sustainable and Organic Products covers biodegradable packaging, organic textiles and green alternatives." },
  { q: "What certifications does EEC check for food sourcing categories?", a: "Food Commodities suppliers are screened for FSSAI registration, BRC/BRCGS and amfori BSCI certification, with HACCP certification screened as a baseline requirement. Processed and Packaged Foods suppliers are screened for BRC/BRCGS, FSSC 22000 and amfori BSCI certification, with IFS Food certification required for suppliers serving German and French buyers. Fresh and Agricultural Products suppliers are screened for GlobalG.A.P., GRASP and amfori BSCI certification." },
  { q: "What certifications does EEC check for textile and healthcare categories?", a: "Healthcare and Hospital Textile Supplies manufacturers are screened for ISO 9001, OEKO-TEX Standard 100 and BSCI compliance. Home Textile, Apparel and Hospitality Products manufacturers are screened for BSCI and/or SEDEX audit compliance, with GOTS and OEKO-TEX STEP certification available for organic and sustainable textile requirements." },
  { q: "Does EEC source organic and eco-friendly products?", a: "Yes. Eco-Friendly, Sustainable and Organic Products is one of the six active sourcing desks, covering biodegradable packaging, organic textiles and green alternatives from manufacturers screened for GOTS certification and EU Organic or NPOP equivalence." },
];

export default function Categories() {
  const [categories, setCategories] = useState(fallbackCategories);
  useEffect(() => {
    api.get("/categories").then(({ data }) => {
      if (Array.isArray(data) && data.length) setCategories(data);
    }).catch(() => {
      setCategories(fallbackCategories);
    });
  }, []);

  return (
    <div data-testid="categories-page">
      <Seo
        title="Product Categories | Global Sourcing Solutions | EEC"
        description="Explore EEC global sourcing categories and connect with verified manufacturers across food, textiles, healthcare textiles, sustainable products and more. Singapore Headquartered with expertise across India and Asia."
        canonical="https://eectrade.com/categories"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "Categories", item: "https://eectrade.com/categories" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "EEC Active Sourcing Categories",
            description: "Six active sourcing categories managed by Elan Exports Consultancy across India and Asia",
            numberOfItems: 6,
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Food Commodities",
                description: "Rice, sugar, pulses, edible oils and spices sourced from manufacturers screened for FSSAI registration, BRC/BRCGS and amfori BSCI certification.",
                url: "https://eectrade.com/categories#food-commodities",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Processed and Packaged Foods",
                description: "Snacks, beverages, frozen foods and ready meals from manufacturers screened for BRC/BRCGS, FSSC 22000 and amfori BSCI certification.",
                url: "https://eectrade.com/categories#processed-packaged-foods",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Fresh and Agricultural Products",
                description: "Fruits, vegetables and organic produce from farms screened for GlobalG.A.P., GRASP and amfori BSCI certification, with phytosanitary certificates coordinated where required.",
                url: "https://eectrade.com/categories#fresh-agricultural",
              },
              {
                "@type": "ListItem",
                position: 4,
                name: "Healthcare and Hospital Textile Supplies",
                description: "Hospital textiles, PPE, medical linen and non-regulated consumables from manufacturers screened for ISO 9001, OEKO-TEX Standard 100 and BSCI compliance.",
                url: "https://eectrade.com/categories#healthcare-hospital",
              },
              {
                "@type": "ListItem",
                position: 5,
                name: "Home Textile, Apparel and Hospitality Products",
                description: "Bed linen, towels, uniforms and hotel textiles from manufacturers screened for BSCI and/or SEDEX audit compliance.",
                url: "https://eectrade.com/categories#home-textile-hospitality",
              },
              {
                "@type": "ListItem",
                position: 6,
                name: "Eco-Friendly, Sustainable and Organic Products",
                description: "Biodegradable packaging, organic textiles and green alternatives from manufacturers screened for GOTS certification and EU Organic / NPOP equivalence.",
                url: "https://eectrade.com/categories#eco-friendly-sustainable",
              },
            ],
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
          <div className="overline mb-4">Categories</div>
          <h1 className="sr-only">India Sourcing Categories. Food, Textiles, Healthcare Textiles and More.</h1>
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light text-[#012D76] max-w-3xl" aria-hidden="true">
            Active sourcing desks across <span className="gold-text">six categories.</span>
          </p>
          <p className="mt-6 text-[#3A4759] max-w-2xl">
            We maintain <span className="text-[#8A6F2B] font-semibold">dedicated supplier benches</span> for each category. Click a category to see the products EEC sources, the certifications screened and the brief format we use.
          </p>
        </div>
      </section>

      {/* Category Cards */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((c, i) => (
            <div id={c.anchor || c.id} key={c.id} className="relative overflow-hidden border hairline bg-surface group" data-testid={`category-item-${c.id}`}>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-[4/5] md:aspect-auto md:self-stretch overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.alt || c.name}
                    loading="lazy"
                    decoding="async"
                    width={IMAGE_DIMENSIONS[c.image]?.width}
                    height={IMAGE_DIMENSIONS[c.image]?.height}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-700"
                  />
                </div>
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    <div className="overline mb-3">{(i + 1).toString().padStart(2, "0")}</div>
                    <Link to={`/categories/${c.slug || c.anchor || c.id}`} className="font-display text-2xl text-[#012D76] tracking-tight mb-2 block hover:text-[#8A6F2B] transition-colors" data-testid={`category-link-${c.id}`}>
                      {c.name}
                    </Link>
                    <p className="text-[#3A4759] text-sm leading-relaxed">{c.tagline}</p>
                    <p className="text-[#3A4759] text-sm leading-relaxed mt-4">{c.body}</p>
                  </div>
                  <Link to="/buyer/intake" className="inline-flex items-center gap-2 text-[#8A6F2B] hover:text-[#8A6F2B] text-sm tracking-wide mt-6 self-start" data-testid={`category-cta-${c.id}`}>
                    {c.cta || `Source ${c.name.toLowerCase()}`} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-24 border-t hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-8">
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

    </div>
  );
}
