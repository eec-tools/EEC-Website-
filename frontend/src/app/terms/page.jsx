import Terms from "@/views/Terms";

export const metadata = {
  title: "Terms of Service | Elan Exports Consultancy",
  description: "Terms of Service for Elan Exports Consultancy. Please read these terms carefully before using our platform and services.",
  alternates: {
    canonical: "https://eectrade.com/terms",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsPage() {
  return <Terms />;
}
