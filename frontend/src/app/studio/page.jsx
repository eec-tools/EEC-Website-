import { Suspense } from "react";
import Studio from "@/views/studio/Studio";

export const metadata = {
  title: "Social Studio | Elan Exports Consultancy",
  description: "EEC social media planning and approval.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-[#6B7280]">Loading the Studio…</div>}>
      <Studio />
    </Suspense>
  );
}
