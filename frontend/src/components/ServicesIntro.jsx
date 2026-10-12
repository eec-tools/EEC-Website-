"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const TOTAL_MS = 6800; // CSS wipe-out starts at 5.8s and takes 0.9s (see .eec-intro in index.css)

// Plays on every full page load of the homepage (including refresh), but not when someone
// navigates back to it from another page inside the app.
let playedInThisPageLoad = false;

const SERVICES = [
  { n: "01", title: "Supplier Background Check", tag: "For buyers" },
  { n: "02", title: "India Sourcing Feasibility Snapshot", tag: "For buyers" },
  { n: "03", title: "Export Readiness Diagnostic", tag: "For suppliers · Limited pilot" },
];

// The overlay is rendered on the server and animated with CSS, so it covers the page from the
// very first paint (no flash of the homepage underneath). JS only adds skip / scroll lock / cleanup.
export default function ServicesIntro() {
  const [phase, setPhase] = useState(() => (playedInThisPageLoad ? "closed" : "playing"));

  const skip = useCallback(() => {
    setPhase((p) => (p === "playing" ? "leaving" : p));
  }, []);
  const close = useCallback(() => setPhase("closed"), []);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    playedInThisPageLoad = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setPhase("closed");
      return undefined;
    }

    const timer = setTimeout(close, TOTAL_MS);
    const onKey = (e) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [phase, skip, close]);

  useEffect(() => {
    if (phase !== "leaving") return undefined;
    const timer = setTimeout(close, 600);
    return () => clearTimeout(timer);
  }, [phase, close]);

  if (phase === "closed") return null;

  return (
    <div
      className="eec-intro grain"
      data-phase={phase}
      role="dialog"
      aria-label="Introducing EEC's new sourcing and export support services"
      data-testid="services-intro"
    >
      {/* ripples + India -> Singapore route, purely decorative */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="eec-i-ring" style={{ "--d": "0s" }} />
        <span className="eec-i-ring" style={{ "--d": "1.4s" }} />
        <span className="eec-i-ring" style={{ "--d": "2.8s" }} />
        <svg
          viewBox="0 0 1000 220"
          className="absolute bottom-[4%] left-1/2 w-[130%] max-w-[1200px] -translate-x-1/2 opacity-60"
        >
          <path
            className="eec-i-route"
            pathLength="1"
            d="M150 170 Q 500 -50 850 140"
            fill="none"
            stroke="#E7C873"
            strokeWidth="1.5"
            strokeDasharray="1"
            style={{ "--d": "0.8s" }}
          />
          <circle className="eec-i-dot" cx="150" cy="170" r="6" fill="#E7C873" style={{ "--d": "0.8s" }} />
          <circle className="eec-i-dot" cx="850" cy="140" r="6" fill="#E7C873" style={{ "--d": "2.8s" }} />
          <text x="150" y="200" textAnchor="middle" fill="#fff" fontSize="14" letterSpacing="4" style={{ opacity: 0.8 }}>
            INDIA
          </text>
          <text x="850" y="170" textAnchor="middle" fill="#fff" fontSize="14" letterSpacing="4" style={{ opacity: 0.8 }}>
            SINGAPORE
          </text>
          <circle r="5" fill="#fff" className="eec-i-dot" style={{ "--d": "3s" }}>
            <animateMotion dur="2.4s" begin="3s" fill="freeze" path="M150 170 Q 500 -50 850 140" />
          </circle>
        </svg>
      </div>

      <button
        type="button"
        onClick={skip}
        className="absolute right-5 top-5 z-10 min-h-[44px] px-4 text-xs uppercase tracking-[0.22em] text-white/70 hover:text-white"
        data-testid="services-intro-skip"
      >
        Skip intro
      </button>

      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col justify-center px-6 py-20 lg:px-10">
        <div className="flex items-center gap-4">
          <span className="eec-i-draw block h-px w-16 bg-[#C9A23F]" style={{ "--d": "0.1s" }} />
          <span className="eec-i-rise text-[11px] uppercase tracking-[0.3em] text-white/80" style={{ "--d": "0.25s" }}>
            Elan Exports Consultancy
          </span>
        </div>

        <div
          className="eec-i-pop mt-8 inline-flex w-fit items-center gap-2 border border-[#C9A23F]/70 bg-[#C9A23F]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E7C873]"
          style={{ "--d": "0.5s" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E7C873] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E7C873]" />
          </span>
          New · Sourcing &amp; Export Support Services
        </div>

        <h2 className="mt-6 font-display text-[40px] leading-[1.05] sm:text-6xl lg:text-7xl tracking-tight">
          <span className="eec-i-mask">
            <span style={{ "--d": "0.75s" }}>Smarter sourcing.</span>
          </span>
          <span className="eec-i-mask">
            <span className="eec-i-shine italic font-normal" style={{ "--d": "1s" }}>
              Stronger exports.
            </span>
          </span>
        </h2>

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {SERVICES.map(({ n, title, tag }, i) => (
            <li key={n} className="eec-i-card eec-i-rise p-5" style={{ "--d": `${1.7 + i * 0.22}s` }}>
              <div className="font-display text-2xl text-[#E7C873]">{n}</div>
              <div className="mt-3 font-display text-lg leading-snug">{title}</div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-white/60">{tag}</div>
            </li>
          ))}
        </ul>

        <div className="eec-i-rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--d": "2.7s" }}>
          <Link href="/for-buyers#buyer-services" onClick={close} className="eec-btn-accent" data-testid="services-intro-buyers">
            Explore Buyer Services <ArrowUpRight size={16} />
          </Link>
          <Link
            href="/for-suppliers#export-readiness"
            onClick={close}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-white/40 px-6 text-sm font-medium tracking-wide text-white transition-colors hover:bg-white/10"
            data-testid="services-intro-suppliers"
          >
            Explore Supplier Services <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10" aria-hidden="true">
        <div className="eec-i-progress h-full bg-[#C9A23F]" />
      </div>
    </div>
  );
}
