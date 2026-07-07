"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { fallbackCategories, FAQ } from "@/constants/categoriesData";

export default function Categories() {
  const [categories, setCategories] = useState(fallbackCategories);
  useEffect(() => {
    api.get("/categories").then(({ data }) => {
      if (Array.isArray(data) && data.length) setCategories(data);
    }).catch(() => {
      setCategories(fallbackCategories);
    });
  }, []);

  return (
    <div data-testid="categories-page">


      <section className="border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
          <div className="overline mb-4">Categories</div>
          <h1 className="sr-only">India Sourcing Categories. Food, Textiles, Healthcare Textiles and More.</h1>
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light text-[#012D76] max-w-3xl" aria-hidden="true">
            Active sourcing desks across <span className="gold-text">six categories.</span>
          </p>
          <p className="mt-6 text-[#3A4759] max-w-2xl">
            We maintain <span className="text-[#8A6F2B] font-semibold">dedicated supplier benches</span> for each category. Click a category to see the products EEC sources, the certifications screened and the brief format we use.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((c, i) => (
            <div id={c.anchor || c.id} key={c.id} className="relative overflow-hidden border hairline bg-surface group" data-testid={`category-item-${c.id}`}>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative aspect-[4/5] md:aspect-auto md:self-stretch overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.alt || c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-70 group-hover:opacity-100 transition-all duration-700"
                  />
                </div>
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    <div className="overline mb-3">{(i + 1).toString().padStart(2, "0")}</div>
                    <Link href={`/categories/${c.slug || c.anchor || c.id}`} className="font-display text-2xl text-[#012D76] tracking-tight mb-2 block hover:text-[#8A6F2B] transition-colors" data-testid={`category-link-${c.id}`}>
                      {c.name}
                    </Link>
                    <p className="text-[#3A4759] text-sm leading-relaxed">{c.tagline}</p>
                    <p className="text-[#3A4759] text-sm leading-relaxed mt-4">{c.body}</p>
                  </div>
                  <Link href="/buyer/intake" className="inline-flex items-center gap-2 text-[#8A6F2B] hover:text-[#8A6F2B] text-sm tracking-wide mt-6 self-start" data-testid={`category-cta-${c.id}`}>
                    {c.cta || `Source ${c.name.toLowerCase()}`} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="overline mb-3">FAQ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light mb-8">
            Frequently asked questions about EEC sourcing categories
          </h2>
          <div className="border hairline bg-surface overflow-hidden">
            {FAQ.map(({ q, a }, idx) => (
              <div key={q} className={`${idx !== FAQ.length - 1 ? "border-b hairline" : ""} grid grid-cols-1 md:grid-cols-[36%_1fr]`}>
                <div className="p-5 md:p-6 font-medium text-[#012D76]">{q}</div>
                <div className="p-5 md:p-6 text-[#3A4759] leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
