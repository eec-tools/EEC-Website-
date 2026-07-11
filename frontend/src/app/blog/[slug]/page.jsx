import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { getBlogs, getBlogBySlug, getAdjacentBlogs } from "@/constants/blogData";

export async function generateStaticParams() {
  return getBlogs().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(props) {
  const params = await props.params;
  const blog = getBlogBySlug(params.slug);
  if (!blog) return {};

  return {
    title: `${blog.title} | EEC Blog`,
    description: blog.excerpt,
    alternates: {
      canonical: `https://www.eectrade.com/blog/${blog.slug}`,
    },
    openGraph: {
      type: "article",
      siteName: "Elan Exports Consultancy",
      title: blog.title,
      description: blog.excerpt,
      url: `https://www.eectrade.com/blog/${blog.slug}`,
      images: [{ url: `https://www.eectrade.com${blog.image}` }],
    },
  };
}

const DATE_FORMAT = { year: "numeric", month: "long", day: "numeric" };

export default async function BlogDetailPage(props) {
  const params = await props.params;
  const blog = getBlogBySlug(params.slug);

  if (!blog) {
    redirect("/");
  }

  const { previous, next } = getAdjacentBlogs(blog.slug);
  const canonical = `https://www.eectrade.com/blog/${blog.slug}`;
  const publishedDate = new Date(blog.publishedAt).toLocaleDateString("en-US", DATE_FORMAT);

  return (
    <div data-testid="blog-detail-page">
      {/* BreadcrumbList and BlogPosting Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.eectrade.com" },
              { "@type": "ListItem", position: 2, name: blog.title, item: canonical },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blog.title,
            description: blog.excerpt,
            image: `https://www.eectrade.com${blog.image}`,
            datePublished: blog.publishedAt,
            author: { "@type": "Person", name: blog.author },
            publisher: { "@type": "Organization", name: "Elan Exports Consultancy", url: "https://www.eectrade.com" },
            url: canonical,
          }),
        }}
      />

      <div className="border-b hairline">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4 flex items-center gap-2 text-sm text-[#6B7280]">
          <Link href="/" className="hover:text-[#012D76]">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="text-[#012D76] font-medium truncate">{blog.title}</span>
        </div>
      </div>

      <section className="border-b hairline">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <span className="inline-block text-[10px] tracking-[0.18em] uppercase font-semibold text-[#012D76] border border-[#E5EBF2] bg-white px-2.5 py-1">
            {blog.category}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight font-light text-[#012D76] mt-5 leading-tight">
            {blog.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6B7280]">
            <span>By <span className="text-[#3A4759] font-medium">{blog.author}</span></span>
            <span aria-hidden="true">&middot;</span>
            <time dateTime={blog.publishedAt}>{publishedDate}</time>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 lg:px-8 -mt-6 lg:-mt-8">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#EFF4F9]">
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover grayscale-[10%]"
          />
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-base sm:text-lg text-[#3A4759] leading-relaxed space-y-6">
            {blog.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {(previous || next) && (
        <section className="py-12 lg:py-16 border-t hairline bg-surface">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {previous ? (
              <Link
                href={`/blog/${previous.slug}`}
                className="group border hairline p-6 hover:border-[#012D76]/40 transition-colors"
                data-testid="blog-nav-previous"
              >
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8A6F2B]">
                  <ArrowLeft size={14} aria-hidden="true" /> Previous
                </span>
                <p className="mt-3 font-display text-lg text-[#012D76] group-hover:text-[#8A6F2B] transition-colors">
                  {previous.title}
                </p>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="group border hairline p-6 hover:border-[#012D76]/40 transition-colors sm:text-right"
                data-testid="blog-nav-next"
              >
                <span className="inline-flex items-center gap-2 sm:justify-end text-xs uppercase tracking-[0.18em] text-[#8A6F2B]">
                  Next <ArrowRight size={14} aria-hidden="true" />
                </span>
                <p className="mt-3 font-display text-lg text-[#012D76] group-hover:text-[#8A6F2B] transition-colors">
                  {next.title}
                </p>
              </Link>
            ) : <div />}
          </div>
        </section>
      )}
    </div>
  );
}
