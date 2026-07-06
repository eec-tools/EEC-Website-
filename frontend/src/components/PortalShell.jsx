import React from "react";

/**
 * Shared wrapper for internal portal pages (Admin, Supplier, Buyer).
 * Adds a subtle ship-wheel watermark + soft gradient backdrop for brand presence
 * while keeping the page content fully on top, accessible, and unaffected.
 */
export default function PortalShell({ children, testid }) {
  return (
    <div className="relative overflow-hidden isolate" data-testid={testid}>
      {/* Soft sky-blue corner wash, top-right */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[60vw] h-[480px] -z-10"
        style={{
          background:
            "radial-gradient(60% 80% at 100% 0%, rgba(0,150,214,0.06) 0%, rgba(0,150,214,0.02) 50%, transparent 80%)",
        }}
        aria-hidden="true"
      />
      {/* Soft gold corner wash, bottom-left */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-[55vw] h-[420px] -z-10"
        style={{
          background:
            "radial-gradient(60% 80% at 0% 100%, rgba(201,162,63,0.05) 0%, rgba(201,162,63,0.015) 50%, transparent 80%)",
        }}
        aria-hidden="true"
      />
      {/* Large ship-wheel watermark, lower-right of the page */}
      <img
        src="/ship-wheel.svg"
        alt=""
        aria-hidden="true"
        draggable="false"
        loading="lazy"
        decoding="async"
        width="200"
        height="200"
        className="pointer-events-none select-none absolute -bottom-24 -right-24 w-[420px] md:w-[560px] lg:w-[720px] opacity-[0.045] -z-10"
        style={{ color: "#012D76" }}
      />
      {/* Small accent wheel, upper-left */}
      <img
        src="/ship-wheel.svg"
        alt=""
        aria-hidden="true"
        draggable="false"
        loading="lazy"
        decoding="async"
        width="200"
        height="200"
        className="pointer-events-none select-none hidden lg:block absolute top-16 -left-20 w-[260px] opacity-[0.035] -z-10"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
