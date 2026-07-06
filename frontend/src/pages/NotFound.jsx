import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Seo from "@/components/Seo";

export default function NotFound() {
  return (
    <div data-testid="not-found-page">
      <Seo
        title="Page Not Found | Elan Exports Consultancy"
        description="The page you're looking for doesn't exist or has moved."
        robots="noindex, nofollow"
      />
      <section className="min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 lg:py-24 text-center">
          <div className="overline mb-4 justify-center">404</div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-light text-[#012D76]">
            Page not found.
          </h1>
          <p className="mt-4 text-[#3A4759] max-w-md mx-auto">
            The page you're looking for doesn't exist or may have moved.
          </p>
          <Link to="/" className="eec-btn-primary mt-8 inline-flex" data-testid="not-found-home-link">
            Back to home <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
