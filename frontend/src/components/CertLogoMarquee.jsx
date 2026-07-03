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

export function CertLogo({ name, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center px-3 py-2 border hairline bg-transparent ${className}`}
      title={name}
    >
      <span className="text-xs md:text-sm font-medium text-[#012D76] whitespace-nowrap text-center">{name}</span>
    </div>
  );
}

// Fixed marquee speed shared by every slider on the page (Home ticker + all 6 category
// sliders on For Suppliers) so they all scroll at the same rate.
const MARQUEE_SPEED = 26;
// Minimum item count per loop pass — short category lists (e.g. 3-4 certs) get repeated
// until the row is dense/continuous rather than looking sparse before it loops.
const MIN_REPEAT_COUNT = 10;

// Continuous, seamless-loop logo marquee on a white background. Pauses on hover. Renders
// the (possibly repeated) item list twice back to back so the -50% translateX loop point
// is invisible.
export function CertMarquee({ names }) {
  const repeatTimes = Math.max(1, Math.ceil(MIN_REPEAT_COUNT / names.length));
  const filled = Array.from({ length: repeatTimes }, () => names).flat();
  return (
    <div className="relative bg-white eec-cert-marquee-row py-3">
      <div className="flex flex-wrap items-center gap-3">
        {filled.map((name, i) => (
          <CertLogo key={`${name}-${i}`} name={name} />
        ))}
      </div>
    </div>
  );
}
