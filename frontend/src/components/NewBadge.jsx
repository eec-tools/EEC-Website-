import React from "react";

// Marks the October 2026 services so they read as distinct from the established sourcing
// programme and the supplier network application.
export default function NewBadge({ children = "New", className = "" }) {
  return (
    <span
      className={`inline-flex items-center bg-[#C9A23F] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#012D76] ${className}`}
    >
      {children}
    </span>
  );
}
