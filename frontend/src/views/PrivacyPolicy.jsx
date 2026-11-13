import React from "react";
import Link from "next/link";
import { COMPANY } from "@/constants/company";
import { LegalPage, LegalSection, BulletList, MailLink } from "@/components/legal/LegalPage";

const PRIVACY_SECTIONS = [
  { id: "introduction", title: "Introduction and who we are" },
  { id: "information-we-collect", title: "Personal information we collect" },
  { id: "automatic-information", title: "Information collected automatically" },
  { id: "linkedin", title: "LinkedIn authorisation and API data" },
  { id: "purposes", title: "How and why we use information" },
  { id: "legal-basis", title: "Legal basis and consent" },
  { id: "storage-security", title: "Data storage and security" },
  { id: "sharing", title: "Sharing and service providers" },
  { id: "retention", title: "Data retention" },
  { id: "your-rights", title: "Your privacy rights" },
  { id: "withdraw-consent", title: "Withdrawing consent" },
  { id: "disconnect-linkedin", title: "Disconnecting LinkedIn" },
  { id: "deletion", title: "Requesting deletion of your data" },
  { id: "cookies", title: "Cookies and analytics" },
  { id: "transfers", title: "International transfers" },
  { id: "children", title: "Children's privacy" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact us about privacy" },
];

const deletionSubject = "Data deletion request";

export default function PrivacyPolicy() {
  const email = COMPANY.privacyEmail;
  const mail = <MailLink email={email} />;

  return (
    <LegalPage
      testId="privacy-policy-page"
      title="Privacy Policy"
      updated={COMPANY.privacyPolicyUpdated}
      intro={`This policy explains what personal data ${COMPANY.legalName} collects through ${COMPANY.websiteUrl.replace("https://", "")} and related services, why we collect it, who we share it with, and the choices you have.`}
      sections={PRIVACY_SECTIONS}
    >
      <LegalSection id="introduction" number={1} title="Introduction and who we are">
        <p>
          {COMPANY.legalName} (&ldquo;{COMPANY.shortName}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a {COMPANY.registrationType.toLowerCase()} ({COMPANY.registrationNumberLabel}: {COMPANY.registrationNumber}), registered with the {COMPANY.registrationAuthority}. Our registered office is {COMPANY.addressFull}. We operate under the brand name {COMPANY.brandName}.
        </p>
        <p>
          We are a sourcing and procurement consultancy. We are the organisation responsible for the personal data described in this policy. We handle it in accordance with Singapore&rsquo;s Personal Data Protection Act 2012 (PDPA) and, where it applies to you, other data protection laws such as the EU and UK GDPR.
        </p>
        <p>
          This policy covers our website, our contact and enquiry forms, our buyer and supplier portals, our newsletter, and our use of social media services, including LinkedIn, to manage our own organisation profile.
        </p>
      </LegalSection>

      <LegalSection id="information-we-collect" number={2} title="Personal information we collect">
        <p>What we collect depends on how you deal with us. We collect only what you give us or what is needed to provide the service you asked for.</p>
        <BulletList
          items={[
            <><strong>Contact form:</strong> your name, email address, optional phone number, optional company name, and the message you write.</>,
            <><strong>Buyer service requests and supplier export-readiness applications:</strong> your name, job title, company name and country, email address, phone number, company registration details, company LinkedIn page address, the service you are asking about, details of your sourcing or export needs, and any supporting documents you choose to upload.</>,
            <><strong>Accounts and portals:</strong> your name, email address, role (buyer or supplier), company name, and a password. We store passwords only in hashed form. If you sign in with Google, we receive the name and email address Google shares with us. Buyer briefs and supplier applications you submit in a portal, and documents you upload to them, are stored against your account.</>,
            <><strong>Newsletter:</strong> your email address and the page you subscribed from.</>,
            <><strong>Correspondence:</strong> emails, messages and call notes exchanged with us, including via WhatsApp if you contact us there.</>,
            <><strong>LinkedIn:</strong> see section 4 for the limited information involved when we use LinkedIn services.</>,
          ]}
        />
        <p>Please do not send us sensitive personal data (for example government ID numbers, financial account details or health information) unless we specifically ask for it.</p>
      </LegalSection>

      <LegalSection id="automatic-information" number={3} title="Information collected automatically">
        <p>When you visit our website, certain information is collected automatically:</p>
        <BulletList
          items={[
            "Technical data such as your IP address, browser type and version, device type, operating system and language.",
            "Usage data such as the pages you view, how long you stay, links you click, and the page that referred you.",
            "Session recordings of how you move through and interact with our pages, collected by our analytics provider (see section 14).",
            "Standard server and hosting logs kept by our hosting provider for security and reliability.",
          ]}
        />
      </LegalSection>

      <LegalSection id="linkedin" number={4} title="LinkedIn authorisation and API data">
        <p>
          This section explains how we use LinkedIn services. {COMPANY.brandName} is an independent company. We are not endorsed by, sponsored by, or partnered with LinkedIn Corporation or Microsoft. &ldquo;LinkedIn&rdquo; is a trademark of its owner and is used here only to identify the service.
        </p>
        <p><strong>Our website does not currently offer &ldquo;Sign in with LinkedIn&rdquo;.</strong> Visitors to this website are not asked to connect a LinkedIn account, and we do not collect LinkedIn profile data from visitors through the website. You can still choose to type or paste your company&rsquo;s LinkedIn page address into our enquiry forms, which we treat as ordinary form data under section 2.</p>
        <p>
          <strong>Our use of the LinkedIn Community Management API.</strong> {COMPANY.legalName} uses, or has applied to use, the LinkedIn Community Management API {COMPANY.linkedin.appPurpose}. The API is used for our own organisation&rsquo;s Page. We do not use it to offer a service to other companies or to manage other organisations&rsquo; Pages.
        </p>
        <p><strong>Authorisation and consent.</strong> Access happens only when an authorised EEC team member who administers our Company Page signs in to LinkedIn and approves our application using LinkedIn&rsquo;s own authorisation screen. That screen lists the permissions requested. Nothing is accessed for a person who has not gone through it. We request only the permissions needed for the purpose above.</p>
        <p><strong>Categories of information we may access:</strong></p>
        <BulletList
          items={[
            "Basic identification of the authorising team member (such as their LinkedIn member identifier and name), so we can link the authorisation to the correct person and Page.",
            "Information about our own Company Page and the posts we publish on it.",
            "Comments and reactions on our Page posts, which may include the public name of the commenter, the text of the comment, and the time it was made, as LinkedIn makes available to Page administrators.",
            "Aggregate Page and post analytics, such as impressions, clicks and follower counts.",
          ]}
        />
        <p><strong>Purpose of use.</strong> We use this information only to publish and manage our Page content, respond to people who engage with our Page, moderate comments, and understand how our Page content performs. We do not use LinkedIn data to build advertising profiles, to make automated decisions about individuals, to send unsolicited messages, or to monitor individual members.</p>
        <p><strong>Storage and retention.</strong> Access tokens issued to us by LinkedIn are kept only as long as the authorisation remains active, and are deleted when the authorisation is disconnected or expires. We keep engagement and analytics data only as long as it is useful for managing and reporting on our Page, and delete it when requested (see sections 12 and 13) or when no longer needed.</p>
        <p><strong>Sharing.</strong> We do not sell LinkedIn data, share it with data brokers, or use it for advertising. It is available only to authorised EEC personnel and to service providers that host or support our systems, who may process it only for us (see section 8).</p>
        <p>You can disconnect LinkedIn access and ask us to delete related data at any time (sections 11 to 13). Your use of LinkedIn itself is governed by LinkedIn&rsquo;s own terms and privacy policy.</p>
      </LegalSection>

      <LegalSection id="purposes" number={5} title="How and why we use information">
        <BulletList
          items={[
            "To respond to your enquiries and contact-form messages.",
            "To assess, scope and deliver sourcing, procurement and export-readiness services you request, including verifying business details and registration information.",
            "To create and manage portal accounts and authenticate sign-ins.",
            "To match buyer requirements with suitable suppliers, sharing buyer contact details with a supplier only with the buyer’s consent.",
            "To send confirmations, service messages and, where you have subscribed, our newsletter.",
            "To operate and manage our LinkedIn Company Page (section 4).",
            "To keep our website secure, prevent spam and abuse, and fix faults.",
            "To understand how the website is used and improve it.",
            "To meet legal, accounting and regulatory obligations and to establish or defend legal claims.",
          ]}
        />
      </LegalSection>

      <LegalSection id="legal-basis" number={6} title="Legal basis and consent">
        <p>Under the PDPA we collect, use and disclose personal data with your consent, including consent that you give by submitting a form or contacting us for a stated purpose, and where the law allows it without consent (for example where necessary to perform a contract with you, or for legitimate interests that are not outweighed by your rights).</p>
        <p>Where GDPR or UK GDPR applies, our legal bases are: your consent (for example for newsletters), performance of a contract or steps you request before entering one, our legitimate interests in running and securing a B2B consultancy and website, and compliance with legal obligations.</p>
        <p>Where we rely on your consent you may withdraw it at any time (section 11). Withdrawing consent does not affect processing done before you withdrew it.</p>
      </LegalSection>

      <LegalSection id="storage-security" number={7} title="Data storage and security">
        <p>Form submissions are emailed to our business mailbox and may be recorded in an internal spreadsheet used by our team. Contact-form messages are also stored in our application database. Account data and uploaded documents are stored in our database and file storage with access restricted to your account and to authorised EEC administrators.</p>
        <p>Measures we use include HTTPS encryption in transit, hashed password storage, role-based access controls, and security headers on our website. No system is completely secure, and we cannot guarantee absolute security. If you believe your data or account has been compromised, contact us immediately at {mail}.</p>
      </LegalSection>

      <LegalSection id="sharing" number={8} title="Sharing and service providers">
        <p>We do not sell your personal data. We share it only as follows:</p>
        <BulletList
          items={[
            <><strong>Service providers</strong> that host and run our website and systems for us, under confidentiality and data-protection obligations. These currently include providers of web and application hosting, database and file storage, email delivery, workflow automation and spreadsheets used to log form submissions, sign-in with Google, and website analytics.</>,
            <><strong>Suppliers and buyers in our network,</strong> where needed to deliver a service you requested, and buyer contact details only with the buyer&rsquo;s consent.</>,
            <><strong>Professional advisers</strong> such as lawyers and accountants, where needed.</>,
            <><strong>Authorities and courts,</strong> where required by law or to protect rights and safety.</>,
            <><strong>A successor organisation,</strong> if our business is reorganised or sold, subject to this policy.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="retention" number={9} title="Data retention">
        <p>We keep personal data only for as long as needed for the purposes in this policy or as the law requires:</p>
        <BulletList
          items={[
            "Enquiries and contact messages: while we deal with your enquiry and for a reasonable period afterwards in case of follow-up.",
            "Accounts, applications and uploaded documents: while your account or engagement is active, and for a reasonable period afterwards.",
            "Newsletter subscriptions: until you unsubscribe or ask us to remove you.",
            "LinkedIn authorisation tokens: until the authorisation is disconnected or expires. LinkedIn engagement data: as described in section 4.",
            "Business, accounting and tax records: for the period Singapore law requires (generally at least five years).",
          ]}
        />
        <p>When data is no longer needed, we delete it or anonymise it.</p>
      </LegalSection>

      <LegalSection id="your-rights" number={10} title="Your privacy rights">
        <p>Subject to applicable law, you may ask us to:</p>
        <BulletList
          items={[
            "tell you what personal data we hold about you and how it has been used or disclosed;",
            "correct personal data that is inaccurate or incomplete;",
            "delete your personal data (section 13);",
            "stop or restrict our use of your data, or withdraw your consent (section 11);",
            "provide your data in a portable format, where GDPR applies.",
          ]}
        />
        <p>To make a request, email {mail}. We may need to verify your identity first. If you are not satisfied with our response, you may complain to the Personal Data Protection Commission of Singapore or, where relevant, your local data protection authority.</p>
      </LegalSection>

      <LegalSection id="withdraw-consent" number={11} title="How to withdraw consent">
        <BulletList
          items={[
            <>Email {mail} with the subject &ldquo;Withdraw consent&rdquo; and tell us which use you are withdrawing from (for example the newsletter, or all marketing contact).</>,
            "To stop LinkedIn access, follow section 12.",
            "To stop analytics cookies and recordings, use the browser controls described in section 14.",
          ]}
        />
        <p>We will act on a withdrawal within {COMPANY.privacyAcknowledgeBusinessDays} business days of confirming it is from you, and will tell you if withdrawal affects the services we can provide.</p>
      </LegalSection>

      <LegalSection id="disconnect-linkedin" number={12} title="How to disconnect LinkedIn accounts">
        <p>You can remove our access to your LinkedIn account at any time, without contacting us:</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>Sign in to LinkedIn and open <strong>Settings &amp; Privacy</strong>.</li>
          <li>Choose <strong>Data privacy</strong>, then <strong>Permitted services</strong>.</li>
          <li>Find our application in the list and select <strong>Remove</strong>.</li>
        </ol>
        <p>Once removed, our application can no longer use your authorisation. You can also email {mail} and ask us to disconnect it and delete the stored token on our side. Full steps are on our <Link href="/data-deletion" className="text-[#012D76] underline underline-offset-2">Data Deletion page</Link>.</p>
      </LegalSection>

      <LegalSection id="deletion" number={13} title="How to request deletion of personal information and LinkedIn-related data">
        <p>
          Email {mail} using the subject line &ldquo;{deletionSubject}&rdquo;, or use the ready-made email on our <Link href="/data-deletion" className="text-[#012D76] underline underline-offset-2">Data Deletion page</Link>. Tell us the name and email address you used with us and what you want deleted. We verify your identity before acting, then delete or anonymise your data except where the law requires us to keep it. Deletion requests are handled by our team manually, not by an automated system. We acknowledge requests within {COMPANY.privacyAcknowledgeBusinessDays} business days and aim to complete them within {COMPANY.privacyCompletionDays} days.
        </p>
      </LegalSection>

      <LegalSection id="cookies" number={14} title="Cookies and analytics">
        <BulletList
          items={[
            <><strong>Essential cookies:</strong> if you sign in to a portal we set sign-in cookies (an access cookie valid for up to 24 hours and a refresh cookie valid for up to 7 days). They are needed for the portal to work.</>,
            <><strong>Analytics:</strong> we use PostHog, a product-analytics service, to understand how visitors use the site. It may set cookies or similar identifiers in your browser and record page views, clicks and session replays. The data is sent to PostHog&rsquo;s servers in the United States.</>,
            <><strong>Third-party fonts:</strong> our pages load fonts from Google Fonts, which means your browser contacts Google when a page loads.</>,
          ]}
        />
        <p>You can block or delete cookies in your browser settings, and most browsers offer a &ldquo;Do Not Track&rdquo; or content-blocking option that stops analytics scripts. The website still works if you do, although portal sign-in needs cookies.</p>
      </LegalSection>

      <LegalSection id="transfers" number={15} title="International data transfers">
        <p>We are based in Singapore and work with teams and partners in India and elsewhere in Asia, and some of our service providers (including our analytics provider) process data in other countries such as the United States. Your personal data may therefore be transferred outside Singapore. Where it is, we take steps to ensure it receives a standard of protection comparable to that required by the PDPA, for example through contractual commitments.</p>
      </LegalSection>

      <LegalSection id="children" number={16} title="Children&rsquo;s privacy">
        <p>Our services are for businesses and are not directed at anyone under 18. We do not knowingly collect personal data from children. If you think a child has given us personal data, email {mail} and we will delete it.</p>
      </LegalSection>

      <LegalSection id="changes" number={17} title="Changes to this policy">
        <p>We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top shows when it last changed. If we make a material change, we will post a notice on this website or contact you by email where we have your address.</p>
      </LegalSection>

      <LegalSection id="contact" number={18} title="Contact us about privacy">
        <p>
          <strong>{COMPANY.legalName}</strong><br />
          Privacy requests: {mail}<br />
          General enquiries: <MailLink email={COMPANY.contactEmail} /><br />
          Registered office: {COMPANY.addressFull}<br />
          Telephone: <a href={COMPANY.phoneHref} className="text-[#012D76] underline underline-offset-2">{COMPANY.phone}</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
