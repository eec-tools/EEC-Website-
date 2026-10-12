"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import NewBadge from "@/components/NewBadge";
import { BUYER_OFFERS, CUSTOM_SOURCING_OFFER, SERVICE_TERMS } from "@/constants/services";

function BulletList({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm text-[#3A4759] leading-relaxed">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8A6F2B]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FixedFeeOffer({ offer, index }) {
  return (
    <article id={`offer-${offer.id}`} className="eec-new-card p-7 lg:p-9 flex flex-col scroll-mt-36" data-testid={`buyer-offer-${offer.id}`}>
      <div className="flex items-center gap-3">
        <NewBadge />
        <span className="text-[10px] uppercase tracking-[0.18em] text-[#8A6F2B] font-semibold">Offer {index + 1}</span>
      </div>
      <h3 className="font-display text-2xl lg:text-3xl text-[#012D76] mt-3">{offer.title}</h3>
      <p className="mt-3 text-sm font-semibold text-[#8A6F2B]" data-testid={`buyer-offer-pricing-${offer.id}`}>
        Pricing will be shared after you submit a request.
      </p>
      <p className="mt-4 text-sm text-[#3A4759] leading-relaxed">{offer.intro}</p>

      <div className="mt-6 text-xs uppercase tracking-[0.14em] text-[#012D76] font-semibold">What EEC will provide</div>
      <div className="mt-3">
        <BulletList items={offer.provides} />
      </div>

      <dl className="mt-6 space-y-3 text-sm text-[#3A4759] leading-relaxed">
        <div>
          <dt className="inline font-semibold text-[#012D76]">Scope: </dt>
          <dd className="inline">{offer.scope}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[#012D76]">Delivery: </dt>
          <dd className="inline">{offer.delivery}</dd>
        </div>
      </dl>

      <p className="mt-5 border hairline border-[#C9A23F]/60 bg-white p-4 text-sm text-[#5C3A00] leading-relaxed">
        <span className="font-semibold">Important:</span> {offer.important}
      </p>

      <div className="mt-auto pt-8">
        <Link href={offer.href} className="eec-btn-primary" data-testid={`buyer-offer-cta-${offer.id}`}>
          {offer.cta} <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function Chooser() {
  const options = [...BUYER_OFFERS, CUSTOM_SOURCING_OFFER];
  return (
    <div className="mt-10" data-testid="buyer-service-chooser">
      <div className="text-xs uppercase tracking-[0.14em] text-[#012D76] font-semibold mb-4">Which service is right for you?</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((o) => (
          <a
            key={o.id}
            href={`#offer-${o.id}`}
            className="eec-new-card eec-new-card--lift group block p-5"
          >
            <div className="font-display text-lg text-[#012D76] leading-snug">{o.title}</div>
            <p className="mt-3 text-sm text-[#3A4759] leading-relaxed">
              <span className="font-semibold text-[#012D76]">Choose this if: </span>
              {o.useWhen}
            </p>
            <dl className="mt-4 space-y-1 text-xs text-[#3A4759]">
              <div><dt className="inline font-semibold text-[#012D76]">Covers: </dt><dd className="inline">{o.compare.scope}</dd></div>
              <div><dt className="inline font-semibold text-[#012D76]">Delivery: </dt><dd className="inline">{o.compare.delivery}</dd></div>
            </dl>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[#8A6F2B]">
              See details <span aria-hidden="true">↓</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ServiceTerms() {
  const [open, setOpen] = useState(false);

  // Let forms deep-link straight to the terms (/for-buyers#service-terms).
  useEffect(() => {
    const syncWithHash = () => {
      if (window.location.hash === "#service-terms") {
        setOpen(true);
        document.getElementById("service-terms")?.scrollIntoView();
      }
    };
    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);
    return () => window.removeEventListener("hashchange", syncWithHash);
  }, []);

  return (
    <div id="service-terms" className="mt-12 border hairline bg-white scroll-mt-24" data-testid="service-terms">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="service-terms-panel"
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
        data-testid="service-terms-toggle"
      >
        <span className="font-display text-xl lg:text-2xl text-[#012D76]">Service Terms</span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-[#8A6F2B] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id="service-terms-panel" className="border-t hairline p-6 lg:p-8">
          <ol className="space-y-6">
            {SERVICE_TERMS.map(({ title, body }, i) => (
              <li key={title}>
                <h4 className="font-medium text-[#012D76]">
                  {i + 1}. {title}
                </h4>
                <p className="mt-1 text-sm text-[#3A4759] leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function BuyerServiceOffers() {
  const custom = CUSTOM_SOURCING_OFFER;

  return (
    <section id="buyer-services" className="py-24 border-b hairline bg-surface scroll-mt-32" data-testid="buyer-services">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <NewBadge />
          <div className="overline">EEC Buyer Services</div>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight font-light max-w-3xl">
          Sourcing &amp; Export Support Services for International Buyers
        </h2>
        <p className="mt-4 text-[#3A4759] leading-relaxed max-w-3xl">
          Quick, fixed-scope research services. They are separate from EEC&apos;s full sourcing programme and the Buyer Portal, so you can start with one focused piece of work.
        </p>

        <Chooser />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {BUYER_OFFERS.map((offer, i) => (
            <FixedFeeOffer key={offer.id} offer={offer} index={i} />
          ))}
        </div>

        <article id={`offer-${custom.id}`} className="eec-new-card mt-6 p-7 lg:p-9 scroll-mt-36" data-testid={`buyer-offer-${custom.id}`}>
          <div className="flex items-center gap-3">
            <NewBadge />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#8A6F2B] font-semibold">Offer 3</span>
          </div>
          <h3 className="font-display text-2xl lg:text-3xl text-[#012D76] mt-3">{custom.title}</h3>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-sm text-[#3A4759] leading-relaxed mb-4">{custom.intro}</p>
              <BulletList items={custom.provides} />
            </div>
            <div>
              <p className="text-sm text-[#3A4759] leading-relaxed">{custom.note}</p>
              <Link href={custom.href} className="eec-btn-primary mt-6" data-testid={`buyer-offer-cta-${custom.id}`}>
                {custom.cta} <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </article>

        <p className="mt-6 text-sm text-[#3A4759]">
          By submitting a request you agree to the Service Terms below.
        </p>
        <ServiceTerms />
      </div>
    </section>
  );
}
