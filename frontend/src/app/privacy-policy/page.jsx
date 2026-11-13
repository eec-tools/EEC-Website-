import PrivacyPolicy from "@/views/PrivacyPolicy";

export const metadata = {
  title: "Privacy Policy | Elan Exports Consultancy",
  description: "How Elan Exports Consultancy Pte. Ltd. collects, uses, shares and protects personal data, including LinkedIn authorisation data, and how to withdraw consent or request deletion.",
  alternates: {
    canonical: "https://eectrade.com/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
