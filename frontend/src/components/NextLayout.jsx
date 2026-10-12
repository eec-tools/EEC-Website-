"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ArrowUpRight, Globe, Handshake, ShieldCheck, MapPin, ArrowRight, LinkedinIcon, InstagramIcon, FacebookIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/for-buyers", label: "For Buyers" },
  { to: "/for-suppliers", label: "For Suppliers" },
  { to: "/categories", label: "Categories" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
];

function Logo({ size = "header" }) {
  const heightClass = size === "footer"
    ? "h-20 md:h-28 lg:h-36"
    : "h-16 md:h-24 lg:h-32";
  return (
    <Link href="/" className="inline-flex items-center group" data-testid={size === "footer" ? "footer-brand-link" : "brand-link"}>
      <picture>
        <source srcSet="/images/EEC-logo-WBG.webp" type="image/webp" />
        <img
          src="/images/EEC-logo-WBG.png"
          alt="Elan Exports Consultancy, Singapore Headquartered sourcing consultancy"
          width="1254"
          height="1254"
          className={`${heightClass} w-auto select-none transition-transform duration-300 group-hover:scale-[1.03]`}
          data-testid={size === "footer" ? "footer-logo" : "brand-logo"}
          draggable="false"
        />
      </picture>
      <span className="sr-only">Elan Exports Consultancy</span>
    </Link>
  );
}

function CtaCard({ eyebrow, heading, description, primaryCta, secondaryCta, footnote }) {
  return (
    <div className="bg-white rounded-3xl px-8 md:px-10 py-5 md:py-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 max-w-md">
        <span className="text-sm text-[#6B7280] tracking-wide">{eyebrow}</span>
        <h2 className="text-[28px] md:text-[32px] font-bold text-[#012D76] leading-tight">
          {heading}
        </h2>
        {description && (
          <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-[#012D76] hover:bg-[#011F54] text-white text-sm font-medium px-6 py-3 rounded-full w-fit transition-colors"
          >
            {primaryCta.label} <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-transparent border border-[#012D76] text-[#012D76] hover:bg-[#012D76]/5 text-sm font-medium px-6 py-3 rounded-full w-fit transition-colors"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
        {footnote && (
          <p className="text-xs text-[#6B7280] tracking-wide">{footnote}</p>
        )}
      </div>
      <div className="flex-shrink-0 w-52 h-52 md:w-64 md:h-64 hidden sm:block" aria-hidden="true">
        <picture>
          <source srcSet="/images/cta/cta-orbit.webp" type="image/webp" />
          <img
            src="/images/cta/cta-orbit.png"
            alt=""
            width="256"
            height="256"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain select-none"
            draggable="false"
          />
        </picture>
      </div>
    </div>
  );
}

const CTA_CONFIG = {
  "/for-buyers": {
    eyebrow: "Get Started",
    heading: "Start Your Sourcing Engagement with EEC",
    description: "Response within two working days.",
    primaryCta: { label: "Request a Buyer Service", href: "/buyer-service-request" },
    secondaryCta: { label: "See buyer services", href: "/for-buyers#buyer-services" },
    footnote: "Singapore HQ | Verified supplier network | India and Asia operations",
  },
  "/for-suppliers": {
    eyebrow: "Ready to apply?",
    heading: "Apply to Join the EEC Verified Supplier Network",
    description: "Applications reviewed within 3 to 5 business days. No listing fees, ever. Manufacturers with active production facilities only.",
    primaryCta: { label: "Join the Supplier Network", href: "/register?role=supplier" },
    secondaryCta: { label: "Apply for Export Readiness Support", href: "/export-readiness-application" },
    footnote: "Singapore HQ | No supplier listing fees | Active buyer programmes across Europe, US and Middle East",
  },
  "/categories": {
    eyebrow: "Get started",
    heading: "Ready to source from our global supplier network?",
    primaryCta: { label: "Request a Buyer Service", href: "/buyer-service-request" },
    secondaryCta: { label: "Explore Buyer Services", href: "/for-buyers#buyer-services" },
  },
  "/services": {
    eyebrow: "Get Started",
    heading: "Ready to scope your sourcing engagement?",
    description: "No commitment required. Response within two working days.",
    primaryCta: { label: "Request a Buyer Service", href: "/buyer-service-request" },
    secondaryCta: { label: "Explore Buyer Services", href: "/for-buyers#buyer-services" },
  },
  "/about": {
    eyebrow: "Get Started",
    heading: "Ready to work with EEC?",
    description: "No commitment required. Response within two working days.",
    primaryCta: { label: "Request a Buyer Service", href: "/buyer-service-request" },
    secondaryCta: { label: "Join the Supplier Network", href: "/register?role=supplier" },
  },
  "/": {
    eyebrow: "Get Started",
    heading: "Build Your Sourcing Advantage",
    description: "From qualified suppliers to landed goods, one team, start to finish.",
    primaryCta: { label: "Request a Buyer Service", href: "/buyer-service-request" },
    secondaryCta: { label: "Join the Supplier Network", href: "/register?role=supplier" },
    footnote: "Singapore HQ | Verified supplier network | India and Asia operations",
  },
};

function FooterColHeader({ title }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full bg-[#C9A23F] flex-shrink-0" aria-hidden="true" />
        <span className="text-xs font-bold tracking-widest text-[#012D76]">{title}</span>
      </div>
      <div className="h-px w-6 bg-[#C9A23F]" aria-hidden="true" />
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li className="list-none">
      <Link
        href={to}
        className="inline-flex items-center gap-1 text-[13px] text-[#3A4759] hover:text-[#012D76] hover:underline transition-colors whitespace-nowrap"
      >
        {children}
        <ArrowUpRight size={12} className="opacity-60 flex-shrink-0" aria-hidden="true" />
      </Link>
    </li>
  );
}

function FooterBadge({ icon, label1, label2 }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-full bg-[#EFF4F9] flex items-center justify-center text-[#012D76] flex-shrink-0">
        {icon}
      </div>
      <span className="text-[11px] font-semibold text-[#012D76] leading-tight">
        {label1}<br />{label2}
      </span>
    </div>
  );
}

export default function NextLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const ctaConfig = CTA_CONFIG[pathname];

  const onNewsletterSubmit = async (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setNewsletterSubmitting(true);
    try {
      await api.post("/newsletter/subscribe", { email, source_page: pathname });
      toast.success("Subscribed. Thanks for staying updated.");
      setNewsletterEmail("");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Subscription failed");
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-eec">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFFFFF]/90 border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 md:h-28 lg:h-32 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => {
              const isActive = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  href={n.to}
                  data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`text-sm tracking-wide pb-1 border-b-2 transition-colors ${
                    isActive
                      ? "text-[#012D76] font-semibold border-[#C9A23F]"
                      : "text-[#3A4759] border-transparent hover:text-[#012D76]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user && user.user_id ? (
              <>
                <Link
                  href={user.role === "admin" ? "/admin" : user.role === "supplier" ? "/supplier" : "/buyer"}
                  className="text-sm text-[#3A4759] hover:text-[#012D76] tracking-wide"
                  data-testid="nav-portal"
                >
                  {user.role === "admin" ? "Admin console" : user.role === "supplier" ? "Supplier portal" : "Buyer portal"}
                </Link>
                <button
                  onClick={async () => { await logout(); router.push("/"); }}
                  className="text-sm text-[#6B7280] hover:text-[#012D76] tracking-wide"
                  data-testid="nav-logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[#3A4759] hover:text-[#012D76] tracking-wide" data-testid="nav-login">
                  Sign in
                </Link>
                <Link href="/services" className="eec-btn-primary text-xs h-10 px-5" data-testid="nav-apply">
                  Get Started <ArrowUpRight size={14} />
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-[#012D76] p-2.5 -m-2.5"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            data-testid="mobile-menu-toggle"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t hairline bg-[#FFFFFF]">
            <div className="px-5 py-4 flex flex-col gap-3">
              {NAV.map((n) => {
                const isActive = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    href={n.to}
                    onClick={() => setOpen(false)}
                    className={`text-sm py-2 pl-3 border-l-2 ${
                      isActive ? "text-[#012D76] font-semibold border-[#C9A23F]" : "text-[#012D76] border-transparent"
                    }`}
                    data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
              {user && user.user_id ? (
                <>
                  <Link href={user.role === "admin" ? "/admin" : user.role === "supplier" ? "/supplier" : "/buyer"} className="text-[#012D76] py-2" onClick={() => setOpen(false)}>
                    {user.role === "admin" ? "Admin Console" : "My Portal"}
                  </Link>
                  <button onClick={async () => { await logout(); setOpen(false); router.push("/"); }} className="text-left text-[#3A4759] py-2">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-[#012D76] py-2" onClick={() => setOpen(false)}>Sign in</Link>
                  <Link href="/services" className="eec-btn-primary" onClick={() => setOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 bg-white px-6 lg:px-8 pb-10" aria-label="Site footer">
        <div className="max-w-7xl mx-auto bg-[#F5F5F7] rounded-3xl shadow-sm px-8 md:px-12 lg:px-14 pt-4 pb-4">

          {ctaConfig && <CtaCard {...ctaConfig} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2.4fr_1.2fr_1.2fr_1.2fr_3.4fr] gap-10 lg:gap-8">

            <div className="flex flex-col gap-5 min-w-0">
              <Link href="/" aria-label="Elan Exports Consultancy home" data-testid="footer-brand-link">
                <picture>
                  <source srcSet="/eec-logo-wbg.webp" type="image/webp" />
                  <img
                    src="/eec-logo-wbg.png"
                    alt="Elan Exports Consultancy, Singapore Headquartered Sourcing Consultancy"
                    className="w-56 lg:w-60 h-auto select-none"
                    width="240"
                    height="240"
                    loading="lazy"
                    decoding="async"
                    data-testid="footer-logo"
                    draggable="false"
                  />
                </picture>
              </Link>
              <p className="text-sm text-[#616873] leading-relaxed max-w-[300px]">
                Singapore-headquartered sourcing consultancy. Embedded procurement support for global buyers sourcing from India and Asia.
              </p>
              <div className="flex items-center justify-between gap-4">
                <FooterBadge icon={<Globe size={17} />} label1="Global" label2="Network" />
                <FooterBadge icon={<Handshake size={17} />} label1="Trusted" label2="Partnerships" />
                <FooterBadge icon={<ShieldCheck size={17} />} label1="Reliable" label2="Sourcing" />
              </div>
            </div>

            <div className="lg:pl-6 min-w-0">
              <FooterColHeader title="BUYERS" />
              <ul className="space-y-3">
                <FooterLink to="/for-buyers">For Buyers</FooterLink>
                <FooterLink to="/buyer-service-request">Request a Buyer Service</FooterLink>
                <FooterLink to="/services">Services</FooterLink>
                <FooterLink to="/categories">Categories</FooterLink>
              </ul>
            </div>

            <div className="lg:pl-6 min-w-0">
              <FooterColHeader title="SUPPLIERS" />
              <ul className="space-y-3">
                <FooterLink to="/for-suppliers">For Suppliers</FooterLink>
                <FooterLink to="/register?role=supplier">Join the Supplier Network</FooterLink>
                <FooterLink to="/export-readiness-application">Export Readiness Support</FooterLink>
                <FooterLink to="/about">About Us</FooterLink>
              </ul>
            </div>

            <div className="lg:pl-6 min-w-0">
              <FooterColHeader title="COMPANY" />
              <ul className="space-y-3">
                <FooterLink to="/login">Sign In</FooterLink>
                <FooterLink to="/register">Register</FooterLink>
                <li className="list-none">
                  <a href="mailto:partners@eectrade.com" className="inline-flex items-center gap-1 text-[13px] text-[#3A4759] hover:text-[#012D76] hover:underline transition-colors whitespace-nowrap">
                    partners@eectrade.com <ArrowUpRight size={12} className="opacity-60 flex-shrink-0" aria-hidden="true" />
                  </a>
                </li>
                <FooterLink to="/privacy">Privacy Policy</FooterLink>
                <FooterLink to="/terms">Terms of Service</FooterLink>
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 lg:pl-6 min-w-0">
              <FooterColHeader title="STAY UPDATED" />
              <p className="text-sm text-[#616873] leading-relaxed mb-4">
                Receive product updates, news, exclusive discounts and early access.
              </p>

              <form
                onSubmit={onNewsletterSubmit}
                className="relative mb-4"
                aria-label="Newsletter signup"
              >
                <label htmlFor="footer-email" className="sr-only">Email address</label>
                <input
                  id="footer-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email..."
                  disabled={newsletterSubmitting}
                  className="w-full rounded-full bg-white border border-[#E5EBF2] px-5 py-3 pr-[52px] text-sm text-[#012D76] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#012D76]/20 focus:border-[#012D76] transition disabled:opacity-60"
                  data-testid="newsletter-email-input"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  disabled={newsletterSubmitting}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#012D76] hover:bg-[#011F54] flex items-center justify-center transition-colors disabled:opacity-60"
                  data-testid="newsletter-submit"
                >
                  {newsletterSubmitting ? (
                    <Loader2 size={15} className="text-white animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight size={15} className="text-white" aria-hidden="true" />
                  )}
                </button>
              </form>

              <div
                className="rounded-2xl w-full max-w-full sm:max-w-[420px] lg:max-w-none px-6 py-3 overflow-hidden bg-cover bg-no-repeat"
                style={{ backgroundImage: "url(/images/footer/location-card-bg.png)", backgroundPosition: "right center" }}
              >
                <div className="flex flex-col items-start text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#EFF4F9] flex items-center justify-center flex-shrink-0">
                      <MapPin size={17} className="text-[#012D76]" aria-hidden="true" />
                    </div>
                    <p className="text-base font-bold text-[#012D76] leading-snug whitespace-nowrap">Singapore HQ</p>
                  </div>
                  <p className="text-sm text-[#616873] leading-relaxed mt-3 text-left">India &amp; Asia Operations<br/>Sourcing Network</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E5EBF2] mt-10 pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-[#616873] whitespace-nowrap">
              © 2026 Elan Exports Consultancy Pte. Ltd. All rights reserved.
            </span>
            <div className="flex items-center gap-2.5 flex-nowrap justify-center">
              <span className="text-xs text-[#616873] whitespace-nowrap">Follow Us</span>
              <a href="https://www.linkedin.com/company/elan-exports/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-[#012D76] hover:bg-[#011F54] flex items-center justify-center transition-colors flex-shrink-0">
                <LinkedinIcon size={15} className="text-white" aria-hidden="true" />
              </a>
              <a href="https://www.instagram.com/elan_exports_consultancy/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-[#012D76] hover:bg-[#011F54] flex items-center justify-center transition-colors flex-shrink-0">
                <InstagramIcon size={15} className="text-white" aria-hidden="true" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61591311811743&sk=about" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-[#012D76] hover:bg-[#011F54] flex items-center justify-center transition-colors flex-shrink-0">
                <FacebookIcon size={15} className="text-white" aria-hidden="true" />
              </a>
            </div>
          </div>

        </div>
      </footer>
      <a href="https://wa.me/6586784216" target="_blank" rel="noopener noreferrer" style={{ right: "calc(1.5rem + var(--eec-sbw, 0px))" }} className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:scale-110 transition-transform duration-200" aria-label="Chat on WhatsApp">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.7-6.415-1.9l-.448-.29-2.65.888.888-2.65-.29-.448A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      </a>
    </div>
  );
}
