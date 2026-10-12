import Services from "@/views/Services";

export const metadata = {
  title: "Global Sourcing and Procurement Services | Singapore Headquartered | EEC",
  description: "EEC offers supplier background checks, India sourcing feasibility snapshots, custom sourcing and procurement support for buyers, and export readiness support for manufacturers. Singapore headquartered, with sourcing expertise across India and Asia.",
  alternates: {
    canonical: "https://eectrade.com/services",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "Global Sourcing and Procurement Services | Singapore Headquartered | EEC",
    description: "Supplier background checks, India sourcing feasibility snapshots, custom sourcing support for buyers and export readiness support for manufacturers.",
    url: "https://eectrade.com/services",
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
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "Services", item: "https://eectrade.com/services" }
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
              "url": "https://eectrade.com"
            },
            "areaServed": ["Europe", "United States", "Middle East", "Asia"],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "EEC Sourcing Services",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Supplier Background Check", "description": "Independent desk-based review of a supplier's publicly available company information and potential risk indicators, delivered as a concise written findings report." } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "India Sourcing Feasibility Snapshot", "description": "Desk-based assessment of the opportunities, challenges and feasibility of sourcing a defined product from India." } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Custom Sourcing & Procurement Support", "description": "Supplier identification, RFQ coordination, quotation comparison, sourcing strategy and ongoing sourcing assistance, scoped to each buyer." } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Export Readiness Diagnostic", "description": "Desk-based assessment of a manufacturer or exporter's readiness for international buyers, including a readiness score and a 90-day improvement plan." } },
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
