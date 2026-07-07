import React from "react";
import { COMPANY } from "@/constants/company";

export default function Terms() {
  return (
    <div data-testid="terms-page">
      <section className="border-b hairline">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
          <div className="overline mb-4">Legal</div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-light text-[#012D76]">Terms of Service</h1>
          <p className="mt-4 text-sm text-[#6B7280]">Last updated: 1 January 2026</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-10 text-[#3A4759] leading-relaxed">

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">1. Agreement to Terms</h2>
            <p>{`By accessing or using the EEC platform (eectrade.com) and services provided by ${COMPANY.legalName} (UEN: ${COMPANY.uen}), incorporated in Singapore ("EEC", "we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform or services.`}</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">2. Services</h2>
            <p>EEC provides sourcing and procurement consultancy services including supplier discovery and qualification, factory assessments, landed cost modelling and shipment coordination. EEC operates as a consultancy, not as a marketplace or agent for either buyers or suppliers. EEC does not guarantee purchase orders, contracts or specific sourcing outcomes.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">3. Account Registration</h2>
            <p className="mb-3">To access certain features of the platform, you must register an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Provide accurate and complete information during registration</li>
              <li>Keep your login credentials confidential</li>
              <li>Notify EEC immediately of any unauthorised use of your account</li>
              <li>Be responsible for all activity under your account</li>
            </ul>
            <p className="mt-3 text-sm">EEC reserves the right to suspend or terminate accounts that violate these Terms.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">4. Buyer Terms</h2>
            <p className="mb-3">Buyers using EEC services acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>The EEC role is to identify and qualify suppliers based on buyer requirements. Final supplier selection and commercial decisions remain with the buyer.</li>
              <li>EEC does not act as a purchasing agent and is not party to any transaction between buyer and supplier</li>
              <li>Sourcing briefs submitted through the platform are used solely to identify suitable manufacturers for the stated requirements</li>
              <li>Service fees are payable as agreed in the engagement scope confirmed at the discovery call</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">5. Supplier Terms</h2>
            <p className="mb-3">Suppliers applying to or participating in the EEC Supplier Network acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>No listing or activation fees are charged to suppliers at any stage</li>
              <li>Inclusion in the EEC network does not guarantee purchase orders or contracts</li>
              <li>All information submitted in the application process must be accurate and complete</li>
              <li>EEC may remove suppliers from the network for non-compliance, misrepresentation or failure to maintain qualification standards</li>
              <li>Trading and re-export businesses are not eligible to apply</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">6. Intellectual Property</h2>
            <p>All content on the EEC platform, including text, graphics, logos and software, is owned by or licensed to EEC and is protected by applicable intellectual property laws. You may not reproduce, distribute or create derivative works without prior EEC written consent.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">7. Confidentiality</h2>
            <p>Any non-public information shared by either party in the course of an engagement (including sourcing briefs, supplier shortlists, audit reports and commercial terms) is confidential and must not be disclosed to third parties without prior written consent.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, EEC shall not be liable for any indirect, incidental, special or consequential damages arising from your use of the platform or services. EEC total liability to you shall not exceed the fees paid by you to EEC in the three months preceding the claim.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">9. Governing Law</h2>
            <p>These Terms are governed by the laws of Singapore. Any dispute arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Singapore.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">10. Changes to Terms</h2>
            <p>EEC may update these Terms from time to time. Material changes will be communicated via the platform or by email. Continued use of our services after notification constitutes acceptance of the updated Terms.</p>
          </div>

          <div>
            <h2 className="font-display text-xl text-[#012D76] mb-3">11. Contact</h2>
            <p>For any queries regarding these Terms, contact:</p>
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
