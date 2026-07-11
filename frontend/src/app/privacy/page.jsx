import Privacy from "@/views/Privacy";

export const metadata = {
  title: "Privacy Policy | Elan Exports Consultancy",
  description: "Privacy Policy for Elan Exports Consultancy. Learn how we collect, use and protect your personal data.",
  alternates: {
    canonical: "https://www.eectrade.com/privacy",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPage() {
  return <Privacy />;
}
