import SupplierPortal from "@/views/SupplierPortal";

export const metadata = {
  title: "Supplier Portal | Elan Exports Consultancy",
  description: "Manage your supplier applications and sourcing briefs.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <SupplierPortal />;
}
