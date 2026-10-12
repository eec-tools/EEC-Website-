import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowUpRight } from "lucide-react";

export default function SubmissionSuccess({ heading, reference, email, confirmationSent, nextSteps, backHref, backLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="border hairline bg-white p-8 lg:p-12 focus:outline-none"
      data-testid="submission-success"
    >
      <CheckCircle2 size={40} className="text-[#2E7D32]" aria-hidden="true" />
      <h2 className="font-display text-2xl lg:text-3xl text-[#012D76] mt-5">{heading}</h2>
      {reference && (
        <p className="mt-4 text-[#012D76]">
          Your reference: <span className="font-semibold" data-testid="submission-reference">{reference}</span>
        </p>
      )}
      <p className="mt-4 text-[#3A4759] leading-relaxed max-w-2xl">
        {confirmationSent
          ? `A confirmation email has been sent to ${email}. If you do not see it, please check your spam folder.`
          : `Our team will contact you at ${email}.`}
      </p>
      <p className="mt-3 text-[#3A4759] leading-relaxed max-w-2xl">{nextSteps}</p>
      <p className="mt-3 text-sm text-[#6B7280]">
        Questions in the meantime? Email{" "}
        <a href="mailto:partners@eectrade.com" className="underline text-[#012D76]">
          partners@eectrade.com
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href={backHref} className="eec-btn-primary">
          {backLabel} <ArrowUpRight size={16} />
        </Link>
        <Link href="/" className="eec-btn-secondary">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
