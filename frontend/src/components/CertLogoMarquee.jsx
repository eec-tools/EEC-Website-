import React from "react";
import { FileCheck } from "lucide-react";

// Master certification name -> logo asset map, shared by Home and For Suppliers pages.
// Names without a source file have no official standalone logo (generic report/document
// types, not brand-holding certifying bodies) and render as a bordered icon badge instead
// of plain text.
export const CERT_LOGOS = {
  "BSCI": "/images/certifications/bsci.png",
  "amfori BSCI": "/images/certifications/amfori-bsci.png",
  "SEDEX": "/images/certifications/sedex.png",
  "SA8000": "/images/certifications/sa8000.png",
  "SMETA": "/images/certifications/smeta.png",
  "OEKO-TEX Standard 100": "/images/certifications/oeko-tex-standard-100.png",
  "OEKO-TEX STEP": "/images/certifications/oeko-tex-step.png",
  "GOTS": "/images/certifications/gots.png",
  "FSSAI": "/images/certifications/fssai.png",
  "HACCP": "/images/certifications/haccp.png",
  "ISO 22000": "/images/certifications/iso-22000.png",
  "FSSC 22000": "/images/certifications/fssc-22000.png",
  "BRC/BRCGS": "/images/certifications/brc-brcgs.png",
  "IFS Food": "/images/certifications/ifs-food.png",
  "GlobalG.A.P.": "/images/certifications/globalgap.png",
  "GRASP": "/images/certifications/grasp.png",
  "GMP": "/images/certifications/gmp.png",
  "ISO 9001": "/images/certifications/iso-9001.png",
  "ISO 14001": "/images/certifications/iso-14001.png",
  "NPOP": "/images/certifications/npop.jpg",
  "EU Organic": "/images/certifications/eu-organic.svg",
  "Rainforest Alliance": "/images/certifications/rainforest-alliance.png",
  "GRS": "/images/certifications/grs.png",
  "CE": "/images/certifications/ce.png",
  "WRAP": "/images/certifications/wrap.png",
  "Higg Index": "/images/certifications/higg-index.png",
  "Kosher": "/images/certifications/kosher.png",
  "Halal": "/images/certifications/halal.png",
  "ASC": "/images/certifications/asc.png",
  "MSC": "/images/certifications/msc.png",
  // No official standalone logo — generic test report / document types.
  "MRL Testing Reports": null,
  "Phytosanitary Certificate": null,
  "Aflatoxin Testing Reports": null,
  "EU Health Certificate": null,
};

export function CertLogo({ name, className = "h-10 md:h-12" }) {
  const src = CERT_LOGOS[name];
  if (!src) {
    return (
      <div
        className={`inline-flex items-center gap-2 ${className} px-4 border hairline bg-white shrink-0`}
        title={name}
      >
        <FileCheck size={16} className="text-[#012D76]/50 shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium text-[#012D76] whitespace-nowrap">{name}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      title={name}
      className={`${className} w-auto object-contain shrink-0`}
    />
  );
}

// Continuous, seamless-loop logo marquee. Pauses on hover. Renders the item list twice
// back to back so the -50% translateX loop point is invisible.
export function CertMarquee({ names, speed = 26 }) {
  const doubled = [...names, ...names];
  return (
    <div className="overflow-hidden eec-cert-marquee-row">
      <div
        className="flex items-center gap-8 animate-marquee"
        style={{ width: "max-content", animationDuration: `${speed}s` }}
      >
        {doubled.map((name, i) => (
          <CertLogo key={`${name}-${i}`} name={name} />
        ))}
      </div>
    </div>
  );
}
