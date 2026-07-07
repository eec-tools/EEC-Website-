import BuyerPortal from "@/views/BuyerPortal";

export const metadata = {
  title: "Buyer Portal | Elan Exports Consultancy",
  description: "Your briefs and sourcing activity.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <BuyerPortal />;
}
