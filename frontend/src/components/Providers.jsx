"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster theme="dark" position="top-right" />
    </AuthProvider>
  );
}
