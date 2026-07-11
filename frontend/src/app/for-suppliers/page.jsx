import ForSuppliers from "@/views/ForSuppliers";

export const metadata = {
  title: "Join EEC Supplier Network | Export to Global Buyers | EEC",
  description: "Apply to join the EEC verified supplier network. Connect with procurement teams across Europe, the US and the Middle East. IEC and GST registration required. No listing fees.",
  alternates: {
    canonical: "https://eectrade.com/for-suppliers",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "Join EEC Supplier Network | Export to Global Buyers | EEC",
    description: "Apply to join the EEC verified supplier network. Connect with procurement teams across Europe, the US and the Middle East. IEC and GST registration required. No listing fees.",
    url: "https://eectrade.com/for-suppliers",
  },
};

export default function ForSuppliersPage() {
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
              { "@type": "ListItem", position: 2, name: "For Suppliers", item: "https://eectrade.com/for-suppliers" }
            ]
          })
        }}
      />
      <ForSuppliers />
    </>
  );
}
