import React from "react";
import { Linkedin, Instagram, Mail, MessageCircle } from "lucide-react";

const SOCIAL_ICONS = {
  linkedin: Linkedin,
  instagram: Instagram,
  email: Mail,
  whatsapp: MessageCircle,
};

// Reusable "founder spotlight" section — warm cream background, oversized display
// headline that the portrait bleeds up into, justified bio copy and a social row.
// All copy/links are passed in via props; nothing business-specific is hardcoded here.
export default function AboutFounderSection({
  name,
  eyebrowText,
  headline = "About Me",
  paragraphs = [],
  photoSrc,
  photoAlt,
  signatureText,
  socialLinks = {},
}) {
  const socialEntries = Object.entries(socialLinks).filter(([, href]) => href);

  return (
    <section
      className="relative py-0 overflow-hidden"
      style={{ background: "var(--eec-cream)" }}
      aria-label={`About ${name}`}
      data-testid="about-founder-section"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10 pt-5 lg:pt-8 pb-0">
        <p
          className="text-center text-[14px] lg:text-[15px] uppercase tracking-[0.15em] font-medium mt-2 lg:mt-3 mb-0 lg:mb-1"
          style={{ color: "var(--eec-olive)" }}
        >
          {eyebrowText}
        </p>
        <h2
          className="font-display-condensed uppercase leading-[0.82] tracking-tight text-center text-[34px] sm:text-[58px] lg:text-[92px] xl:text-[110px] mt-1 lg:mt-2 mb-0 max-w-5xl mx-auto"
          style={{ color: "var(--eec-olive)" }}
        >
          {headline}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 lg:gap-8 items-end">
          <div className="relative self-end -mt-4 sm:-mt-8 lg:-mt-12 -ml-2 sm:-ml-4 lg:-ml-8">
            <img
              src={photoSrc}
              alt={photoAlt || `${name}, Founder`}
              className="w-full h-[430px] sm:h-[580px] lg:h-[760px] object-cover object-top grayscale"
            />
          </div>

          <div className="self-start pt-4 lg:pt-6 pb-0 text-left pr-4 lg:pr-8">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] lg:text-base text-[#1F1F1F] leading-[1.6] text-justify mb-6 last:mb-8"
              >
                {p}
              </p>
            ))}

            {signatureText && (
              <p className="font-script text-4xl lg:text-5xl text-[#2B1D12] mb-6 text-right">
                {signatureText}
              </p>
            )}

            {socialEntries.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-3" aria-hidden="true">
                  <span className="h-px flex-1" style={{ background: "var(--eec-olive-soft)" }} />
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--eec-olive)" }} />
                  <span className="h-px flex-1" style={{ background: "var(--eec-olive-soft)" }} />
                </div>

                <p
                  className="text-center text-xs uppercase tracking-[0.2em] font-medium mb-3"
                  style={{ color: "var(--eec-olive)" }}
                >
                  Let's Connect
                </p>

                <div className="flex items-center justify-center gap-4">
                  {socialEntries.map(([key, href]) => {
                    const Icon = SOCIAL_ICONS[key];
                    if (!Icon) return null;
                    return (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={key}
                        className="w-11 h-11 rounded-full border flex items-center justify-center transition-colors hover:bg-[var(--eec-olive)] hover:text-white"
                        style={{ borderColor: "var(--eec-olive)", color: "var(--eec-olive)" }}
                      >
                        <Icon size={18} strokeWidth={1.75} />
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
