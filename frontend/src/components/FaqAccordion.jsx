"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

// Question-and-answer accordion shared by every FAQ section.
// Answers stay in the DOM when collapsed (so search engines and the FAQPage schema still match
// what is on the page); the collapsed panel is hidden from keyboard and screen readers.
// items: [{ q: string, a: ReactNode }]
export default function FaqAccordion({ items, idPrefix = "faq" }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="border hairline bg-white overflow-hidden" data-testid="faq-accordion">
      {items.map(({ q, a }, i) => {
        const open = openIndex === i;
        const buttonId = `${idPrefix}-q-${i}`;
        const panelId = `${idPrefix}-a-${i}`;
        return (
          <div key={q} className={i !== items.length - 1 ? "border-b hairline" : ""}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className={`w-full flex items-center justify-between gap-6 px-5 md:px-6 py-5 text-left transition-colors duration-200 hover:bg-[#012D76]/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#012D76] ${open ? "bg-[#012D76]/[0.03]" : ""}`}
                data-testid={`faq-question-${i}`}
              >
                <span className="font-medium text-[#012D76] text-base md:text-lg leading-snug">{q}</span>
                <span
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${open ? "border-[#8A6F2B] bg-[#8A6F2B] text-white" : "border-[#012D76]/25 text-[#8A6F2B]"}`}
                  aria-hidden="true"
                >
                  <Plus size={16} className={`transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-45" : ""}`} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100 visible" : "grid-rows-[0fr] opacity-0 invisible"}`}
            >
              <div className="overflow-hidden">
                <div className="px-5 md:px-6 pb-6 pr-14 md:pr-20 text-[#3A4759] leading-relaxed max-w-4xl">{a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
