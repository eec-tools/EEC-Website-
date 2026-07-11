import { getBlogs } from "@/constants/blogData";
import BlogGrid from "@/components/blog/BlogGrid";

export const metadata = {
  title: "Blog | Sourcing Insights and Client Success Stories | EEC",
  description: "Insights on sourcing operations, landed cost optimization and open-book costing, plus client success stories from EEC's global sourcing programmes.",
  alternates: {
    canonical: "https://www.eectrade.com/blog",
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "Blog | Sourcing Insights and Client Success Stories | EEC",
    description: "Insights on sourcing operations, landed cost optimization and open-book costing, plus client success stories from EEC's global sourcing programmes.",
    url: "https://www.eectrade.com/blog",
  },
};

export default function BlogIndexPage() {
  const blogs = getBlogs();
  const canonical = "https://www.eectrade.com/blog";

  return (
    <div data-testid="blog-index-page">
      {/* BreadcrumbList and Blog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.eectrade.com" },
              { "@type": "ListItem", position: 2, name: "Blog", item: canonical },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "EEC Blog",
            url: canonical,
            publisher: { "@type": "Organization", name: "Elan Exports Consultancy", url: "https://www.eectrade.com" },
            blogPost: blogs.map((b) => ({
              "@type": "BlogPosting",
              headline: b.title,
              url: `https://www.eectrade.com/blog/${b.slug}`,
              datePublished: b.publishedAt,
              author: { "@type": "Person", name: b.author },
            })),
          }),
        }}
      />

      <div className="border-b hairline">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <span className="overline">Resources</span>
          <h1 className="font-display text-4xl lg:text-5xl text-[#012D76] mt-5 tracking-tight">
            Blog &amp; Articles
          </h1>
          <p className="mt-4 text-[#3A4759] max-w-2xl">
            Insights on sourcing operations, landed cost optimization and open-book costing, plus client success stories from EEC&apos;s global sourcing programmes.
          </p>
        </div>
      </div>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <BlogGrid blogs={blogs} />
        </div>
      </section>
    </div>
  );
}
