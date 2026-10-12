import { Suspense } from "react";
import ExportReadinessApplication from "@/views/ExportReadinessApplication";

export const metadata = {
  title: "Apply for EEC Export Readiness Support | EEC",
  description:
    "Apply for EEC's complimentary Export Readiness Diagnostic Pilot or request paid export support for manufacturers and exporters.",
  alternates: {
    canonical: "https://eectrade.com/export-readiness-application",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  // Suspense is required because the form reads ?support= to prefill the selected support type.
  return (
    // The wrapper div gives Next.js an element to scroll to the top on navigation
    // (with a null Suspense fallback the page would open at the previous page's scroll position).
    <div>
      <Suspense fallback={null}>
        <ExportReadinessApplication />
      </Suspense>
    </div>
  );
}
