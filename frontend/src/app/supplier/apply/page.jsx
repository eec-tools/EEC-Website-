import SupplierApply from "@/views/SupplierApply";

export const metadata = {
  title: "Supplier Verification Application | EEC",
  description: "Apply to join the EEC verified supplier network.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <SupplierApply />;
}
