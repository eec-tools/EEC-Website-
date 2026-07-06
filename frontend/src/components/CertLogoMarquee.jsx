import React from "react";
import { FileCheck } from "lucide-react";

// Master certification name -> logo asset map, shared by Home and For Suppliers pages.
// Names without a source file have no official standalone logo (generic report/document
// types, not brand-holding certifying bodies) and render as a bordered icon badge instead
// of plain text.
const CERT_LOGOS = {
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

// Logo-on-top, label-below cert tile. Falls back to a generic document icon for
// certification names with no official standalone logo (see the null entries above).
function CertLogo({ name }) {
  const src = CERT_LOGOS[name];
  return (
    <div className="flex flex-col items-center justify-center gap-5 text-center" title={name}>
      <div className="flex items-center justify-center h-20 w-24">
        {src ? (
          <img src={src} alt={name} loading="lazy" width="96" height="80" className="max-h-20 max-w-24 w-auto h-auto object-contain" />
        ) : (
          <FileCheck className="h-10 w-10 text-[#8A6F2B]" aria-hidden="true" />
        )}
      </div>
      <span className="text-sm text-[#012D76]">{name}</span>
    </div>
  );
}

// Awards-style logo row: every cert in the group sits in a single row, separated by
// thin vertical dividers, logo on top and name centered below. Scrolls horizontally
// instead of wrapping so the "one row per category" layout holds on narrow screens.
export function CertGrid({ names }) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid border-t hairline min-w-max sm:min-w-0"
        style={{ gridTemplateColumns: `repeat(${names.length}, minmax(110px, 1fr))` }}
      >
        {names.map((name, i) => (
          <div
            key={name}
            className={`flex items-center justify-center py-10 px-4 ${i !== 0 ? "border-l hairline" : ""}`}
          >
            <CertLogo name={name} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Infinite-scrolling logo strip: dedupes the given names, drops any with no official
// logo (generic report/document types), triples the list for a seamless loop, and
// fades the strip out at both edges. Pauses on hover.
export function CertLogosMarquee({ names }) {
  const logos = [...new Set(names)].filter((name) => CERT_LOGOS[name]);
  const tripled = [...logos, ...logos, ...logos];
  return (
    <div className="relative w-full overflow-hidden eec-certwall-marquee">
      <div className="absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-white via-white/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-white via-white/90 to-transparent z-10 pointer-events-none" />
      <div className="flex items-center gap-1 w-max animate-certwall-scroll">
        {tripled.map((name, i) => (
          <div key={`${name}-${i}`} className="w-24 sm:w-28 h-16 sm:h-20 flex items-center justify-center shrink-0">
            <img
              src={CERT_LOGOS[name]}
              alt={name}
              loading="lazy"
              width="112"
              height="80"
              className="object-contain w-full h-full grayscale hover:grayscale-0 opacity-75 hover:opacity-100 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
