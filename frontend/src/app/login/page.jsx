import Login from "@/views/Login";
import { Suspense } from "react";

export const metadata = {
  title: "Sign In | Elan Exports Consultancy",
  description: "Sign in to access your buyer or supplier dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
