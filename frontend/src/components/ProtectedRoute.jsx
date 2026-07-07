"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user === false) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (!loading && user && role && user.role !== role && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, loading, role, pathname, router]);

  if (loading || user === null || user === false || (role && user.role !== role && user.role !== "admin")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#012D76]/40 text-sm tracking-widest uppercase">
        Verifying credentials…
      </div>
    );
  }

  return children;
}
