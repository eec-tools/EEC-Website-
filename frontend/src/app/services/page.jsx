import Services from "@/views/Services";

export const metadata = {
  title: "Global Sourcing and Procurement Services | Singapore Headquartered | EEC",
  description: "EEC provides supplier identification, supplier qualification, procurement support and sourcing strategy for businesses worldwide. Headquartered in Singapore with extensive sourcing expertise across India and Asia.",
  alternates: {
    canonical: "https://www.eectrade.com/services",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "Global Sourcing and Procurement Services | Singapore Headquartered | EEC",
    description: "EEC provides supplier identification, supplier qualification, procurement support and sourcing strategy for businesses worldwide.",
    url: "https://www.eectrade.com/services",
  },
};

export default function ServicesPage() {
  return (
    <>
      {/* BreadcrumbList and Service Catalog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.eectrade.com" },
              { "@type": "ListItem", position: 2, name: "Services", item: "https://www.eectrade.com/services" }
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
            "serviceType": "Sourcing and Procurement Consultancy",
            "provider": {
              "@type": "Organization",
              "name": "Elan Exports Consultancy Pte. Ltd.",
              "url": "https://www.eectrade.com"
            },
            "areaServed": ["Europe", "United States", "Middle East", "Asia"],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "EEC Sourcing Services",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Supplier Identification and Qualification", "description": "We identify and evaluate manufacturers that align with your product specifications, quality requirements, production capabilities and commercial objectives." } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Supplier Verification and Assessment", "description": "Supplier verification through capability assessments, documentation reviews and compliance evaluations." } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Procurement Support", "description": "EEC supports procurement activities including supplier coordination, commercial discussions and sourcing strategy." } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Supply Chain Coordination", "description": "Coordinating sourcing activities between buyers and suppliers across international supply chains." } }
              ]
            }
          })
        }}
      />
      <Services />
    </>
  );
}
