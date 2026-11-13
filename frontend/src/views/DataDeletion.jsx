import React from "react";
import Link from "next/link";
import { COMPANY } from "@/constants/company";
import { LegalPage, LegalSection, BulletList, MailLink } from "@/components/legal/LegalPage";

const SECTIONS = [
  { id: "what", title: "What you can ask us to delete" },
  { id: "how", title: "How to submit a request" },
  { id: "details", title: "What to include" },
  { id: "verification", title: "How we verify your identity" },
  { id: "handling", title: "How requests are handled" },
  { id: "exceptions", title: "What we may need to keep" },
  { id: "linkedin", title: "Revoking LinkedIn authorisation" },
];

const subject = "Data deletion request";
const bodyTemplate = [
  "Hello,",
  "",
  "I would like to request deletion of my personal data held by Elan Exports Consultancy Pte. Ltd.",
  "",
  "Full name:",
  "Email address used with EEC:",
  "Company name (if any):",
  "How I dealt with EEC (contact form / buyer or supplier form / portal account / newsletter / LinkedIn):",
  "What I want deleted (everything, or specify):",
  "",
  "Thank you.",
].join("\n");

export default function DataDeletion() {
  const email = COMPANY.privacyEmail;
  const mail = <MailLink email={email} />;

  return (
    <LegalPage
      testId="data-deletion-page"
      title="Data Deletion Instructions"
      updated={COMPANY.dataDeletionUpdated}
      intro={`This page explains how to ask ${COMPANY.legalName} to delete your personal data, including data connected to LinkedIn, and how to withdraw LinkedIn authorisation. Requests are handled by our team by email.`}
      sections={SECTIONS}
    >
      <LegalSection id="what" number={1} title="What you can ask us to delete">
        <BulletList
          items={[
            "Messages and details you sent through our contact form.",
            "Buyer service requests, supplier applications and any documents you uploaded.",
            "Your portal account (name, email, role, company, and stored briefs and applications).",
            "Your newsletter subscription.",
            "Data we hold because you authorised our LinkedIn application, such as stored authorisation tokens and Page engagement data linked to you.",
            "Correspondence we hold with you, where we are not required to keep it.",
          ]}
        />
        <p>You can ask for everything or only some of it. See <Link href="/privacy-policy" className="text-[#012D76] underline underline-offset-2">our Privacy Policy</Link> for how we use data.</p>
      </LegalSection>

      <LegalSection id="how" number={2} title="How to submit a request">
        <p>Send an email to <strong>{mail}</strong> with the subject line &ldquo;{subject}&rdquo;.</p>
        <p>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`}
            className="eec-btn-primary inline-flex"
            data-testid="deletion-mailto"
          >
            Open a pre-filled deletion request email
          </a>
        </p>
        <p>
          We do not currently have an automated self-service deletion tool. Every request is read and carried out by a member of our team. If you prefer, you can use the <Link href="/contact" className="text-[#012D76] underline underline-offset-2">contact form</Link> and mention &ldquo;data deletion request&rdquo;. Email is fastest.
        </p>
      </LegalSection>

      <LegalSection id="details" number={3} title="What to include">
        <BulletList
          items={[
            "Your full name.",
            "The email address you used with us (and any other address, phone number or account email we might hold).",
            "Your company name, if you dealt with us on behalf of a company.",
            "How you dealt with us: contact form, buyer or supplier form, portal account, newsletter, or LinkedIn authorisation.",
            "For LinkedIn-related data, the name on the LinkedIn account that authorised our application, and the approximate date.",
            "Whether you want everything deleted or only specific items.",
          ]}
        />
        <p>Please do not send passwords, government ID numbers or other sensitive documents in your request.</p>
      </LegalSection>

      <LegalSection id="verification" number={4} title="How we verify your identity">
        <p>To protect you from someone else asking for your data to be deleted, we verify each request before acting on it:</p>
        <BulletList
          items={[
            "We check that the request comes from the email address on the record, or we send a confirmation message to that address and wait for your reply.",
            "If the details do not match, we may ask a few questions only you would know (for example the approximate date and reference number of an earlier enquiry).",
            "For company data, we may ask you to confirm you are authorised to act for that company.",
            "We never ask for a password or for payment to process a request.",
          ]}
        />
      </LegalSection>

      <LegalSection id="handling" number={5} title="How requests are handled">
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>We acknowledge your request within {COMPANY.privacyAcknowledgeBusinessDays} business days.</li>
          <li>We verify your identity (section 4).</li>
          <li>We locate your data in our systems, which may include our database, uploaded files, email mailbox, an internal spreadsheet of form submissions, and our LinkedIn integration.</li>
          <li>We delete or anonymise it, and ask service providers that hold it for us to do the same.</li>
          <li>We confirm by email once complete. We aim to finish within {COMPANY.privacyCompletionDays} days, and will tell you if we need longer and why.</li>
        </ol>
      </LegalSection>

      <LegalSection id="exceptions" number={6} title="What we may need to keep">
        <p>We may be unable to delete everything where the law or a legitimate need requires it. For example:</p>
        <BulletList
          items={[
            "accounting, invoice and tax records, which Singapore law requires us to keep for at least five years;",
            "records needed for an ongoing or reasonably anticipated legal claim, dispute or investigation;",
            "information needed to comply with a legal or regulatory obligation;",
            "a minimal record that you asked for deletion, so we do not re-add you to mailing lists.",
          ]}
        />
        <p>If we keep anything, we tell you what and why, limit use to that purpose, and delete it once the reason ends.</p>
      </LegalSection>

      <LegalSection id="linkedin" number={7} title="Revoking LinkedIn authorisation">
        <p>If you authorised our LinkedIn application, you can revoke access yourself at any time, without contacting us:</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>Sign in to LinkedIn and open <strong>Settings &amp; Privacy</strong>.</li>
          <li>Go to <strong>Data privacy</strong>, then <strong>Permitted services</strong>.</li>
          <li>Find our application and select <strong>Remove</strong>.</li>
        </ol>
        <p>
          Revoking access stops us from using the authorisation. It does not delete data we already stored, so also send us a deletion request as described in section 2 and mention &ldquo;LinkedIn&rdquo;. We will delete the stored authorisation token and LinkedIn-related data linked to you, subject to section 6.
        </p>
        <p>Questions? Email {mail} or call <a href={COMPANY.phoneHref} className="text-[#012D76] underline underline-offset-2">{COMPANY.phone}</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
