import Register from "@/views/Register";
import { Suspense } from "react";

export const metadata = {
  title: "Create Account | Elan Exports Consultancy",
  description: "Create a buyer or supplier account at Elan Exports Consultancy.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <Register />
    </Suspense>
  );
}
