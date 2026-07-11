import About from "@/views/About";

export const metadata = {
  title: "About Elan Exports Consultancy | Singapore Headquartered Global Sourcing Consultancy",
  description: "Elan Exports Consultancy (EEC) is a Singapore Headquartered global sourcing consultancy connecting buyers with verified manufacturers worldwide. With particular expertise across India and Asia, we help businesses build reliable procurement and supply chain partnerships.",
  alternates: {
    canonical: "https://eectrade.com/about",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "About EEC | Singapore Sourcing Consultancy | Elan Exports Consultancy",
    description: "Elan Exports Consultancy (EEC) is a Singapore Headquartered global sourcing consultancy connecting buyers with verified manufacturers worldwide.",
    url: "https://eectrade.com/about",
  },
};

export default function AboutPage() {
  return (
    <>
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://eectrade.com" },
              { "@type": "ListItem", position: 2, name: "About", item: "https://eectrade.com/about" }
            ]
          })
        }}
      />
      <About />
    </>
  );
}
