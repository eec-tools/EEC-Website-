import Image from "next/image";
import { LinkedinIcon, InstagramIcon, MailIcon, PhoneIcon } from "lucide-react";
import { COMPANY } from "@/constants/company";

const PORTRAIT_IMAGE = "/images/team/shirali-shetty-portrait.webp";

// Plain copy object so this text is easy to swap later without touching JSX.
const FOUNDER_PROFILE = {
  overline: "THE FOUNDER BEHIND EEC",
  headline: "ABOUT THE FOUNDER",
  paragraphs: [
    "Shirali Shetty is the Founder and Chief Executive Officer of Elan Exports Consultancy (EEC), a Singapore-headquartered sourcing and procurement consultancy specializing in global sourcing, supplier verification and vendor qualification, with a global network of trusted manufacturers and suppliers, backed by deep sourcing expertise across India and Asia.",
    "With over 20 years of experience in international trade, manufacturing and supply chain management, she has built strategic partnerships across food commodities, textiles, consumer products and sustainable goods, supporting retailers, importers, distributors and hospitality groups in more than 15 countries through ethical sourcing, supplier due diligence and risk mitigation.",
    "Under her leadership, EEC is driven by a commitment to transparency, integrity and long-term partnerships, helping businesses build resilient supply chains, source with confidence and unlock opportunities in global markets through structured supply chain consulting, vendor management and strategic sourcing.",
  ],
  signature: "Shirali Shetty",
  connectLabel: "Connect with Shirali Shetty",
};

// LinkedIn points to Shirali's personal profile (not the company page used site-wide).
// Instagram reuses the same URL already used site-wide (footer/header).
// Email and WhatsApp reuse the same contact channels already used elsewhere in the codebase.
// All four icons share the same plain outlined style — no filled backgrounds.
const SOCIALS = [
  { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/shirali-shetty/", Icon: LinkedinIcon, external: true },
  { key: "instagram", label: "Instagram", href: COMPANY.socialLinks[1], Icon: InstagramIcon, external: true },
  { key: "email", label: "Email", href: `mailto:${COMPANY.contactEmail}`, Icon: MailIcon, external: false },
  { key: "whatsapp", label: "WhatsApp", href: "https://wa.me/6586784216", Icon: PhoneIcon, external: true },
];

// Same cream background as the team section directly below it, so the two read as one block.
const SECTION_BG = "#F5F3EC";

export default function AboutMeFounderSection() {
  return (
    <section
      aria-label="About the founder"
      className="relative overflow-hidden pt-12 pb-0 lg:pt-16"
      style={{ background: SECTION_BG }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-20">
        <div
          className="inline-block text-base sm:text-lg md:text-xl font-semibold uppercase tracking-[0.32em]"
          style={{ color: "#8A8A3C", fontFamily: "'Outfit', sans-serif" }}
        >
          {FOUNDER_PROFILE.overline}
        </div>
      </div>

      {/*
        Headline stays inside the same max-width container as the rest of the section
        (no full-bleed breakout) and is allowed to wrap, so it can never run past the
        edge of the screen regardless of copy length. Font size is a fluid clamp so it
        still reads as a bold statement line without needing per-breakpoint tuning.
      */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-0 mt-2">
        <h2
          className="font-display-condensed text-center select-none leading-[0.95]"
          style={{ color: "#8A8A3C", fontSize: "clamp(34px, 7.5vw, 128px)" }}
        >
          {FOUNDER_PROFILE.headline}
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/*
            On desktop the photo stretches to match the bio column's full height
            (CSS Grid's default row-stretch behavior) so its bottom edge always lands
            exactly on the section's bottom edge, however long the bio copy is. The
            negative top margin pulls it up to overlap the headline; the height is
            compensated by the same amount so the bottom stays anchored.
          */}
          <div className="lg:col-span-5 relative z-10 -mt-8 sm:-mt-10 lg:-mt-14 xl:-mt-16">
            <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[calc(100%+3.5rem)] xl:h-[calc(100%+4rem)] overflow-hidden">
              <Image
                src={PORTRAIT_IMAGE}
                alt="Shirali Shetty, Founder, seated portrait"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top grayscale"
              />
            </div>
          </div>

          <div className="lg:col-span-7 relative z-10 pt-6 lg:pt-10">
            <div className="max-w-xl mx-auto lg:mx-0">
              {FOUNDER_PROFILE.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mb-4 text-sm sm:text-base leading-[1.6]"
                  style={{ color: "#1A1A1A", textAlign: "justify" }}
                >
                  {paragraph}
                </p>
              ))}

              <p className="font-script text-4xl sm:text-5xl mt-4 text-right" style={{ color: "#3F2418" }}>
                {FOUNDER_PROFILE.signature}
              </p>

              <div className="relative my-6">
                <div className="h-px" style={{ background: "rgba(63,36,24,0.25)" }} />
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                  style={{ background: "#3F2418", transform: "translate(-50%, -50%)" }}
                />
              </div>

              <div className="text-center pb-0">
                <p
                  className="text-xs sm:text-sm tracking-[0.28em] uppercase font-semibold mb-4"
                  style={{ color: "#8A8A3C" }}
                >
                  {FOUNDER_PROFILE.connectLabel}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {SOCIALS.map(({ key, label, href, Icon, external }) => (
                    <a
                      key={key}
                      href={href}
                      aria-label={label}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="w-10 h-10 flex items-center justify-center rounded-full border transition-transform hover:-translate-y-0.5"
                      style={{ borderColor: "#8A8A3C" }}
                    >
                      <Icon size={16} style={{ color: "#8A8A3C" }} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
