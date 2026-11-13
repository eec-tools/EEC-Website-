import React from "react";
import Link from "next/link";

// Shared shell for the public legal pages (privacy policy, terms, data deletion).
// `sections` is [{ id, title }]; each child <LegalSection id title> renders one of them.
export function LegalPage({ testId, title, updated, intro, sections, children }) {
  return (
    <div data-testid={testId}>
      <section className="border-b hairline">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="overline mb-4">Legal</div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-light text-[#012D76]">{title}</h1>
          <p className="mt-4 text-sm text-[#6B7280]">Last updated: {updated}</p>
          {intro && <p className="mt-6 text-[#3A4759] leading-relaxed max-w-3xl">{intro}</p>}
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {sections && sections.length > 0 && (
            <nav aria-label={`${title} contents`} className="mb-12 border hairline bg-[#F5F9FC] p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[#012D76] font-semibold mb-3">Contents</p>
              <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm list-decimal pl-5 marker:text-[#6B7280]">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-[#012D76] hover:underline">{s.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="space-y-10 text-[#3A4759] leading-relaxed">{children}</div>
          <LegalLinks />
        </div>
      </section>
    </div>
  );
}

export function LegalSection({ id, number, title, children }) {
  return (
    <div id={id} className="scroll-mt-32">
      <h2 className="font-display text-xl text-[#012D76] mb-3">{number}. {title}</h2>
      <div className="space-y-3 text-[15px]">{children}</div>
    </div>
  );
}

export function BulletList({ items }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-sm">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function MailLink({ email, subject, body, children }) {
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const href = `mailto:${email}${params.length ? `?${params.join("&")}` : ""}`;
  return (
    <a href={href} className="text-[#012D76] underline underline-offset-2 hover:no-underline break-all">
      {children || email}
    </a>
  );
}

function LegalLinks() {
  return (
    <nav aria-label="Related legal pages" className="mt-14 pt-8 border-t hairline flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <Link href="/privacy-policy" className="text-[#012D76] hover:underline">Privacy Policy</Link>
      <Link href="/terms" className="text-[#012D76] hover:underline">Terms &amp; Conditions</Link>
      <Link href="/data-deletion" className="text-[#012D76] hover:underline">Data Deletion</Link>
      <Link href="/contact" className="text-[#012D76] hover:underline">Contact Us</Link>
    </nav>
  );
}
