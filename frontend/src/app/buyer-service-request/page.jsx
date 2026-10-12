import { Suspense } from "react";
import BuyerServiceRequest from "@/views/BuyerServiceRequest";

export const metadata = {
  title: "Request an EEC Buyer Service | EEC",
  description:
    "Request a Supplier Background Check, India Sourcing Feasibility Snapshot or a custom sourcing proposal from Elan Exports Consultancy.",
  alternates: {
    canonical: "https://eectrade.com/buyer-service-request",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  // Suspense is required because the form reads ?service= to prefill the selected service.
  return (
    // The wrapper div gives Next.js an element to scroll to the top on navigation
    // (with a null Suspense fallback the page would open at the previous page's scroll position).
    <div>
      <Suspense fallback={null}>
        <BuyerServiceRequest />
      </Suspense>
    </div>
  );
}
