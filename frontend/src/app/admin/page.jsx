import AdminDashboard from "@/views/AdminDashboard";

export const metadata = {
  title: "Admin Console | Elan Exports Consultancy",
  description: "EEC Sourcing management console.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <AdminDashboard />;
}
