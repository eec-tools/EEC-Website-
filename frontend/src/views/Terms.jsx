import React from "react";
import Link from "next/link";
import { COMPANY } from "@/constants/company";
import { LegalPage, LegalSection, BulletList, MailLink } from "@/components/legal/LegalPage";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of terms" },
  { id: "services", title: "Our services" },
  { id: "permitted-use", title: "Permitted use of the website" },
  { id: "responsibilities", title: "Your responsibilities" },
  { id: "accounts", title: "Accounts" },
  { id: "buyers", title: "Buyer terms" },
  { id: "suppliers", title: "Supplier terms" },
  { id: "ip", title: "Intellectual property" },
  { id: "confidentiality", title: "Confidentiality" },
  { id: "availability", title: "Service availability" },
  { id: "third-party", title: "Third-party services" },
  { id: "liability", title: "Limitation of liability" },
  { id: "law", title: "Governing law" },
  { id: "changes", title: "Changes to these terms" },
  { id: "contact", title: "Contact" },
];

export default function Terms() {
  return (
    <LegalPage
      testId="terms-page"
      title="Terms & Conditions"
      updated={COMPANY.termsUpdated}
      sections={SECTIONS}
    >
      <LegalSection id="acceptance" number={1} title="Acceptance of terms">
        <p>
          These Terms &amp; Conditions apply to your use of {COMPANY.websiteUrl.replace("https://", "")} and the services provided by {COMPANY.legalName} ({COMPANY.registrationNumberLabel}: {COMPANY.registrationNumber}), a company incorporated in Singapore (&ldquo;EEC&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing or using the website or our services you agree to be bound by these terms and by our <Link href="/privacy-policy" className="text-[#012D76] underline underline-offset-2">Privacy Policy</Link>. If you do not agree, please do not use them.
        </p>
      </LegalSection>

      <LegalSection id="services" number={2} title="Our services">
        <p>EEC provides sourcing and procurement consultancy, including supplier discovery and qualification, factory assessments, landed-cost modelling, shipment coordination and export-readiness support. EEC is a consultancy. It is not a marketplace, and it does not act as purchasing agent for either buyers or suppliers. EEC does not guarantee purchase orders, contracts or specific sourcing outcomes. The scope and fees of each engagement are agreed with you before work begins.</p>
      </LegalSection>

      <LegalSection id="permitted-use" number={3} title="Permitted use of the website">
        <p>You may use the website for lawful business purposes, to learn about our services and to contact us. You must not:</p>
        <BulletList
          items={[
            "use the website in any way that breaks a law or regulation, or infringes anyone else’s rights;",
            "attempt to gain unauthorised access to the website, other accounts, our systems or any connected network;",
            "introduce malware, or interfere with or overload the website, including with automated scraping or bulk submissions;",
            "submit false, misleading or spam content through our forms, or use the contact details on this site to send unsolicited marketing;",
            "copy, resell or exploit website content for commercial purposes without our written consent.",
          ]}
        />
      </LegalSection>

      <LegalSection id="responsibilities" number={4} title="Your responsibilities">
        <BulletList
          items={[
            "Give accurate, complete and current information in forms, applications and correspondence.",
            "Make sure you have the right to share any personal data or documents you send us, including details of other people.",
            "Keep your account credentials confidential and tell us promptly of any unauthorised use.",
            "Make your own commercial decisions. Information on this website is general and is not legal, tax or investment advice.",
          ]}
        />
      </LegalSection>

      <LegalSection id="accounts" number={5} title="Accounts">
        <p>Some features need an account. You are responsible for all activity under your account. We may suspend or terminate accounts that breach these terms, contain false information, or are used abusively.</p>
      </LegalSection>

      <LegalSection id="buyers" number={6} title="Buyer terms">
        <BulletList
          items={[
            "EEC identifies and qualifies suppliers against your requirements. Final supplier selection and commercial decisions remain with you.",
            "EEC is not a party to any transaction between a buyer and a supplier.",
            "Sourcing briefs you submit are used to identify suitable manufacturers for the stated requirements.",
            "Service fees are payable as agreed in the written engagement scope or proposal.",
          ]}
        />
      </LegalSection>

      <LegalSection id="suppliers" number={7} title="Supplier terms">
        <BulletList
          items={[
            "EEC does not charge suppliers listing or activation fees for joining the supplier network. Fees for optional paid support services are agreed in writing before work begins.",
            "Inclusion in the network does not guarantee purchase orders or contracts.",
            "Information in your application must be accurate and complete.",
            "EEC may remove a supplier for non-compliance, misrepresentation, or failure to keep to qualification standards.",
            "Trading and re-export businesses are not eligible to apply.",
          ]}
        />
      </LegalSection>

      <LegalSection id="ip" number={8} title="Intellectual property">
        <p>The content of this website, including text, graphics, logos and software, is owned by or licensed to EEC and protected by intellectual property laws. You may view it and share links to it, but you may not reproduce, distribute or create derivative works from it without our prior written consent. Names and logos of other companies, including LinkedIn, belong to their owners and appear only to identify them. They do not imply endorsement.</p>
      </LegalSection>

      <LegalSection id="confidentiality" number={9} title="Confidentiality">
        <p>Non-public information either party shares during an engagement (including sourcing briefs, supplier shortlists, audit reports and commercial terms) is confidential and must not be disclosed to third parties without the other party&rsquo;s written consent, except as required by law.</p>
      </LegalSection>

      <LegalSection id="availability" number={10} title="Service availability">
        <p>We aim to keep the website available but do not promise uninterrupted or error-free operation. We may change, suspend or withdraw any part of the website or services, for example for maintenance, security or reasons outside our control, and will try to give notice of significant changes where practical.</p>
      </LegalSection>

      <LegalSection id="third-party" number={11} title="Third-party services">
        <p>The website links to and relies on services run by others, such as hosting, email, analytics, Google sign-in, WhatsApp and social media platforms including LinkedIn. We do not control these services and are not responsible for their content, availability or privacy practices. Your use of them is governed by their own terms and policies. EEC is independent of those companies and is not endorsed by or affiliated with them.</p>
      </LegalSection>

      <LegalSection id="liability" number={12} title="Limitation of liability">
        <p>Nothing in these terms limits liability that cannot be limited by law, including for fraud or for death or personal injury caused by negligence. Subject to that, and to the maximum extent permitted by applicable law, EEC is not liable for indirect, incidental, special or consequential loss, or for loss of profit, revenue or data, arising from your use of the website or services. EEC&rsquo;s total liability to you for any claim is limited to the fees you paid to EEC in the three months before the claim arose. The website and general information on it are provided &ldquo;as is&rdquo;.</p>
      </LegalSection>

      <LegalSection id="law" number={13} title="Governing law">
        <p>These terms are governed by the laws of Singapore. Disputes arising from or in connection with them are subject to the exclusive jurisdiction of the courts of Singapore.</p>
      </LegalSection>

      <LegalSection id="changes" number={14} title="Changes to these terms">
        <p>We may update these terms from time to time. The &ldquo;Last updated&rdquo; date above shows the latest version. Continuing to use the website or services after a change means you accept the updated terms.</p>
      </LegalSection>

      <LegalSection id="contact" number={15} title="Contact">
        <p>
          <strong>{COMPANY.legalName}</strong><br />
          {COMPANY.addressFull}<br />
          <MailLink email={COMPANY.contactEmail} /><br />
          <a href={COMPANY.phoneHref} className="text-[#012D76] underline underline-offset-2">{COMPANY.phone}</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
