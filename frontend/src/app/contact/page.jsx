import Contact from "@/views/Contact";
import { COMPANY } from "@/constants/company";

export const metadata = {
  title: "Contact Us | Elan Exports Consultancy",
  description: "Contact Elan Exports Consultancy Pte. Ltd. in Singapore. Business email, telephone, registered office address and a contact form for sourcing and procurement enquiries.",
  alternates: {
    canonical: "https://eectrade.com/contact",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "Contact Elan Exports Consultancy",
    description: "Business email, telephone and registered office of Elan Exports Consultancy Pte. Ltd., Singapore.",
    url: "https://eectrade.com/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact Elan Exports Consultancy",
            url: "https://eectrade.com/contact",
            mainEntity: {
              "@type": "Organization",
              legalName: COMPANY.legalName,
              url: `${COMPANY.websiteUrl}/`,
              email: COMPANY.contactEmail,
              telephone: COMPANY.phone,
              address: {
                "@type": "PostalAddress",
                streetAddress: COMPANY.addressStreet,
                addressLocality: COMPANY.addressCity,
                postalCode: COMPANY.addressPostalCode,
                addressCountry: COMPANY.addressCountry,
              },
            },
          }),
        }}
      />
      <Contact />
    </>
  );
}
