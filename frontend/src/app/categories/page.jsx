import Categories from "@/views/Categories";

export const metadata = {
  title: "Product Categories | Global Sourcing Solutions | EEC",
  description: "Explore EEC global sourcing categories and connect with verified manufacturers across food, textiles, healthcare textiles, sustainable products and more. Singapore Headquartered with expertise across India and Asia.",
  alternates: {
    canonical: "https://eectrade.com/categories",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "Product Categories | Global Sourcing Solutions | EEC",
    description: "Explore EEC global sourcing categories and connect with verified manufacturers across food, textiles, healthcare textiles, sustainable products and more.",
    url: "https://eectrade.com/categories",
  },
};

export default function CategoriesPage() {
  return (
    <>
      {/* BreadcrumbList, ItemList, and FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "Categories", item: "https://eectrade.com/categories" }
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "EEC Active Sourcing Categories",
            "description": "Six active sourcing categories managed by Elan Exports Consultancy across India and Asia",
            "numberOfItems": 6,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Food Commodities",
                "description": "Rice, sugar, pulses, edible oils and spices sourced from manufacturers screened for FSSAI registration, BRC/BRCGS and amfori BSCI certification.",
                "url": "https://eectrade.com/categories#food-commodities"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Processed and Packaged Foods",
                "description": "Snacks, beverages, frozen foods and ready meals from manufacturers screened for BRC/BRCGS, FSSC 22000 and amfori BSCI certification.",
                "url": "https://eectrade.com/categories#processed-packaged-foods"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Fresh and Agricultural Products",
                "description": "Fruits, vegetables and organic produce from farms screened for GlobalG.A.P., GRASP and amfori BSCI certification, with phytosanitary certificates coordinated where required.",
                "url": "https://eectrade.com/categories#fresh-agricultural"
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": "Healthcare and Hospital Textile Supplies",
                "description": "Hospital textiles, PPE, medical linen and non-regulated consumables from manufacturers screened for ISO 9001, OEKO-TEX Standard 100 and BSCI compliance.",
                "url": "https://eectrade.com/categories#healthcare-hospital"
              },
              {
                "@type": "ListItem",
                "position": 5,
                "name": "Home Textile, Apparel and Hospitality Products",
                "description": "Bed linen, towels, uniforms and hotel textiles from manufacturers screened for BSCI and/or SEDEX audit compliance.",
                "url": "https://eectrade.com/categories#home-textile-hospitality"
              },
              {
                "@type": "ListItem",
                "position": 6,
                "name": "Eco-Friendly, Sustainable and Organic Products",
                "description": "Biodegradable packaging, organic textiles and green alternatives from manufacturers screened for GOTS certification and EU Organic / NPOP equivalence.",
                "url": "https://eectrade.com/categories#eco-friendly-sustainable"
              }
            ]
          })
        }}
      />
      <Categories />
    </>
  );
}
