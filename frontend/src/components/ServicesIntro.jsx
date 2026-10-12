"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WORLD_DOTS_PATH } from "@/constants/worldDots";

const TOTAL_MS = 10000; // CSS wipe-out starts at 9.0s and takes 0.9s (see .eec-intro in index.css)

// Plays on every full page load of the homepage (including refresh), but not when someone
// navigates back to it from another page inside the app.
let playedInThisPageLoad = false;

// Map coordinates match worldDots.js: viewBox "-0.5 -0.5 144 56", 2.5 degrees per unit.
const project = ([lon, lat]) => [(lon + 180) / 2.5 - 0.5, (82.5 - lat) / 2.5 - 0.5];
const INDIA = project([78, 21.5]);

// Where EEC's buyers and partners are. Listed roughly west to east so the arcs fan out nicely.
const DESTINATIONS = [
  { name: "New York", lonLat: [-74, 40.7] },
  { name: "Los Angeles", lonLat: [-118.2, 34] },
  { name: "São Paulo", lonLat: [-46.6, -23.5] },
  { name: "London", lonLat: [-0.1, 51.5], label: { dx: -1.2, dy: -1.3, anchor: "end" } },
  { name: "Germany", lonLat: [10, 51], label: { dx: 1.2, dy: -1.3, anchor: "start" } },
  { name: "Johannesburg", lonLat: [28, -26] },
  { name: "Dubai", lonLat: [55.3, 25.2] },
  { name: "Singapore", lonLat: [103.8, 1.35], label: { dx: 0, dy: 2.5, anchor: "middle" } },
  { name: "Tokyo", lonLat: [139.7, 35.7] },
  { name: "Sydney", lonLat: [151.2, -33.9] },
].map((d, i) => {
  const [x, y] = project(d.lonLat);
  const [x0, y0] = INDIA;
  const dist = Math.hypot(x - x0, y - y0);
  // control point: midway, lifted upward so each route arcs over the map
  const cx = (x + x0) / 2;
  const cy = (y + y0) / 2 - Math.min(26, dist * 0.42);
  return { ...d, x, y, path: `M${x0} ${y0}Q${cx} ${cy} ${x} ${y}`, delay: 1.6 + i * 0.42 };
});

const SERVICES = [
  { n: "01", title: "Supplier Background Check", tag: "For buyers", href: "/for-buyers#offer-background-check" },
  { n: "02", title: "India Sourcing Feasibility Snapshot", tag: "For buyers", href: "/for-buyers#offer-feasibility-snapshot" },
  { n: "03", title: "Export Readiness Diagnostic", tag: "For suppliers · Limited pilot", href: "/for-suppliers#export-readiness" },
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
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, skip, close]);

  const isOpen = phase !== "closed";
  useEffect(() => {
    if (!isOpen) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    // Lock page scroll without letting the layout jump. Hiding the page scrollbar widens the
    // viewport by the scrollbar's width, so pad the body (and fixed elements, via --eec-sbw) by
    // that amount; everything then stays exactly where it will be once the scrollbar returns.
    const root = document.documentElement;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const previous = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    root.style.setProperty("--eec-sbw", `${scrollbarWidth}px`);
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.paddingRight = previous.paddingRight;
      root.style.removeProperty("--eec-sbw");
    };
  }, [isOpen]);

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
      {/* India spreading to the world: dotted map, light wave, arcs, purely decorative */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          viewBox="-0.5 -0.5 144 56"
          className="absolute left-[-115vw] top-[46%] w-[230%] -translate-y-1/2 sm:left-1/2 sm:w-[112%] sm:max-w-[1600px] sm:-translate-x-1/2"
        >
          <defs>
            <path id="eec-world-dots" d={WORLD_DOTS_PATH} fill="none" strokeLinecap="round" strokeWidth="0.42" />
            <mask id="eec-world-wave" maskUnits="userSpaceOnUse" x="-0.5" y="-0.5" width="144" height="56">
              <circle className="eec-i-wave" cx={INDIA[0]} cy={INDIA[1]} r="95" fill="#fff" style={{ "--d": "1.4s" }} />
            </mask>
          </defs>

          {/* quiet base map, then a gold copy revealed by the wave spreading out from India */}
          <use href="#eec-world-dots" stroke="#fff" opacity="0.12" className="eec-i-fade" style={{ "--d": "0.2s" }} />
          <use href="#eec-world-dots" stroke="#E7C873" opacity="0.78" mask="url(#eec-world-wave)" />

          {/* routes from India */}
          {DESTINATIONS.map(({ name, x, y, path, delay, label }) => (
            <g key={name}>
              <path
                className="eec-i-arc"
                pathLength="1"
                d={path}
                fill="none"
                stroke="#F3DB9B"
                strokeWidth="0.22"
                strokeLinecap="round"
                style={{ "--d": `${delay}s` }}
              />
              <circle className="eec-i-dot" cx={x} cy={y} r="0.7" fill="#E7C873" style={{ "--d": `${delay + 1.2}s` }} />
              <circle className="eec-i-pulse" cx={x} cy={y} r="0.7" fill="none" stroke="#E7C873" strokeWidth="0.15" style={{ "--d": `${delay + 1.3}s` }} />
              <circle className="eec-i-fade" r="0.38" fill="#fff" style={{ "--d": `${delay + 0.5}s` }}>
                <animateMotion dur="3.2s" begin={`${delay + 0.5}s`} repeatCount="indefinite" path={path} />
              </circle>
              <text
                className="eec-i-label eec-i-label-city eec-i-fade"
                x={x + (label?.dx ?? 0)}
                y={y + (label?.dy ?? 2.3)}
                textAnchor={label?.anchor ?? "middle"}
                fill="#fff"
                fontSize="1.35"
                letterSpacing="0.14"
                style={{ "--d": `${delay + 1.3}s`, opacity: 0.85 }}
              >
                {name.toUpperCase()}
              </text>
            </g>
          ))}

          {/* the origin */}
          <circle className="eec-i-pulse" cx={INDIA[0]} cy={INDIA[1]} r="0.9" fill="none" stroke="#E7C873" strokeWidth="0.2" style={{ "--d": "1s" }} />
          <circle className="eec-i-pulse" cx={INDIA[0]} cy={INDIA[1]} r="0.9" fill="none" stroke="#E7C873" strokeWidth="0.2" style={{ "--d": "2.3s" }} />
          <circle className="eec-i-dot" cx={INDIA[0]} cy={INDIA[1]} r="1.05" fill="#fff" style={{ "--d": "0.9s" }} />
          <circle className="eec-i-dot" cx={INDIA[0]} cy={INDIA[1]} r="0.55" fill="#C9A23F" style={{ "--d": "1s" }} />
          <text
            className="eec-i-label eec-i-fade"
            x={INDIA[0]}
            y={INDIA[1] - 2}
            textAnchor="middle"
            fill="#E7C873"
            fontSize="1.9"
            fontWeight="600"
            letterSpacing="0.3"
            style={{ "--d": "1.1s" }}
          >
            INDIA
          </text>
        </svg>
      </div>
      <div aria-hidden="true" className="eec-i-scrim pointer-events-none absolute inset-0" />

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

        <p className="eec-i-rise mt-5 max-w-xl text-base text-white/80 sm:text-lg" style={{ "--d": "2.6s" }}>
          From India to buyers across the world, with sourcing and export support built for real decisions.
        </p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {SERVICES.map(({ n, title, tag, href }, i) => (
            <li key={n} className="eec-i-card eec-i-rise" style={{ "--d": `${4.8 + i * 0.25}s` }}>
              <Link
                href={href}
                onClick={close}
                className="group block h-full p-5 transition-colors duration-300 hover:bg-white/10 focus-visible:bg-white/10"
                data-testid={`services-intro-card-${n}`}
              >
                <div className="font-display text-2xl text-[#E7C873]">{n}</div>
                <div className="mt-3 font-display text-lg leading-snug">{title}</div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-white/60">{tag}</div>
                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[#E7C873]">
                  View service
                  <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="eec-i-rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--d": "6s" }}>
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
