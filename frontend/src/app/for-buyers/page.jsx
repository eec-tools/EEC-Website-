import ForBuyers from "@/views/ForBuyers";

export const metadata = {
  title: "For Buyers | India Procurement Sourcing Consultancy | EEC",
  description: "EEC helps institutional buyers source from verified manufacturers worldwide. Headquartered in Singapore, we specialise in supplier qualification, procurement support and sourcing across India, Asia and global markets.",
  alternates: {
    canonical: "https://www.eectrade.com/for-buyers",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "For Buyers | India Procurement Sourcing Consultancy | EEC",
    description: "EEC helps institutional buyers source from verified manufacturers worldwide. Singapore Headquartered. Open-book costs. Factory-audited suppliers.",
    url: "https://www.eectrade.com/for-buyers",
  },
};

export default function ForBuyersPage() {
  return (
    <>
      {/* BreadcrumbList and Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.eectrade.com" },
              { "@type": "ListItem", position: 2, name: "For Buyers", item: "https://www.eectrade.com/for-buyers" }
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Sourcing and Procurement Consulting",
            "provider": {
              "@type": "Organization",
              "name": "Elan Exports Consultancy"
            },
            "areaServed": [
              { "@type": "Place", "name": "North America" },
              { "@type": "Place", "name": "European Union" },
              { "@type": "Place", "name": "Middle East" },
              { "@type": "Place", "name": "Asia Pacific" }
            ],
            "description": "Supplier discovery, qualification, factory auditing, landed cost optimization, and procurement support across India, Southeast Asia, and global markets."
          })
        }}
      />
      <ForBuyers />
    </>
  );
}
