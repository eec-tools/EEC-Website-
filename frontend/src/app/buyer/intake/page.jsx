import BuyerIntake from "@/views/BuyerIntake";

export const metadata = {
  title: "Submit a Sourcing Brief | Buyer Intake | EEC",
  description: "Tell EEC about your sourcing need in four short steps. Receive category benchmarks and a recommended sourcing approach within 24 hours.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <BuyerIntake />;
}
