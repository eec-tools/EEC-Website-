import React from "react";
import { COMPANY } from "@/constants/company";

export default function Privacy() {
  return (
    <div data-testid="privacy-page">
      <section className="border-b hairline">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
          <div className="overline mb-4">Legal</div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-light text-[#012D76]">Privacy Policy</h1>
          <p className="mt-4 text-sm text-[#6B7280]">Last updated: 1 January 2026</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-10 text-[#3A4759] leading-relaxed">

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">1. About This Policy</h2>
            <p>{`${COMPANY.legalName} (UEN: ${COMPANY.uen}), incorporated in Singapore ("EEC", "we", "us", "our"), is committed to protecting the personal data of individuals who interact with our platform and services. This Privacy Policy explains how we collect, use, disclose and protect your personal data in accordance with the Singapore Personal Data Protection Act 2012 (PDPA).`}</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">2. Data We Collect</h2>
            <p className="mb-3">We may collect the following categories of personal data:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Identity data: name, company name, job title</li>
              <li>Contact data: email address, phone number, mailing address</li>
              <li>Account data: login credentials, portal activity and sourcing brief history</li>
              <li>Business data: product categories, sourcing requirements, supplier information submitted through sourcing briefs or supplier applications</li>
              <li>Technical data: IP address, browser type, pages visited and usage data collected via cookies</li>
              <li>Communication data: records of correspondence with EEC via email or platform messaging</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">3. How We Use Your Data</h2>
            <p className="mb-3">We use personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>To provide our sourcing and procurement services and manage your account</li>
              <li>To process sourcing briefs and supplier applications</li>
              <li>To communicate with you regarding your enquiries and active engagements</li>
              <li>To match buyer requirements with qualified suppliers in our network</li>
              <li>To improve our platform and services</li>
              <li>To comply with legal and regulatory obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">4. Disclosure of Your Data</h2>
            <p className="mb-3">We may share your personal data with:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Verified manufacturers and suppliers in our network, where necessary to facilitate sourcing (buyer contact details are shared only with buyer consent)</li>
              <li>Third-party service providers who support our platform operations (e.g. cloud hosting, email delivery), under confidentiality obligations</li>
              <li>Regulatory authorities where required by law</li>
            </ul>
            <p className="mt-3 text-sm">We do not sell personal data to third parties.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">5. Data Retention</h2>
            <p>We retain personal data for as long as necessary to fulfil the purposes for which it was collected, or as required by law. Account data is retained for the duration of your active relationship with EEC and for a reasonable period thereafter. You may request deletion of your data at any time (see Section 7).</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">6. Cookies</h2>
            <p>Our platform uses cookies and similar technologies to enhance your experience, analyse usage and support platform functionality. You may disable cookies through your browser settings, though this may affect certain platform features.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">7. Your Rights</h2>
            <p className="mb-3">Subject to applicable law, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-3 text-sm">To exercise any of these rights, contact us at <a href={`mailto:${COMPANY.contactEmail}`} className="text-[#012D76] hover:underline">{COMPANY.contactEmail}</a>.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">8. Data Security</h2>
            <p>We implement appropriate technical and organisational measures to protect personal data against unauthorised access, loss or misuse. However, no method of transmission over the internet is entirely secure.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">9. International Transfers</h2>
            <p>EEC operates from Singapore with procurement teams in India. Personal data may be transferred to and processed in India and other countries where EEC operates. We ensure appropriate safeguards are in place for any such transfers.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via the platform or by email. Continued use of our services after such notification constitutes acceptance of the updated policy.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">11. Contact Us</h2>
            <p>For any privacy-related queries or requests, contact:</p>
            <p className="mt-2 text-sm">
              {COMPANY.legalName}<br />
              {COMPANY.addressFull}<br />
              <a href={`mailto:${COMPANY.contactEmail}`} className="text-[#012D76] hover:underline">{COMPANY.contactEmail}</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
