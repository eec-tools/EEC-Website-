import React from "react";

// Coloured label that tells visitors at a glance who a service is for.
// Blue = international buyers, teal = manufacturers & exporters (matches .eec-buyer-card / .eec-supplier-card).
const STYLES = {
  buyer: { label: "For International Buyers", className: "bg-[#1B4A99] text-white" },
  supplier: { label: "For Manufacturers & Exporters", className: "bg-[#0F766E] text-white" },
};

export default function AudienceTag({ audience, children, className = "" }) {
  const s = STYLES[audience];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${s.className} ${className}`}
    >
      {children || s.label}
    </span>
  );
}
