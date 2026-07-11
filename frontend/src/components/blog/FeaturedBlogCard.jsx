import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import CategoryBadge from "./CategoryBadge";

export default function FeaturedBlogCard({ blog }) {
  if (!blog) return null;

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center"
      data-testid={`blog-featured-${blog.slug}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EFF4F9]">
        <Image
          src={blog.image}
          alt={blog.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover grayscale-[10%] group-hover:scale-[1.02] transition-transform duration-700"
        />
      </div>
      <div>
        <CategoryBadge category={blog.category} />
        <h3 className="font-display text-3xl sm:text-4xl text-[#012D76] tracking-tight mt-4 group-hover:text-[#8A6F2B] transition-colors">
          {blog.title}
        </h3>
        <p className="mt-4 text-[#3A4759] leading-relaxed line-clamp-4">
          {blog.excerpt}
        </p>
        <span className="eec-btn-primary mt-8 inline-flex" data-testid={`blog-featured-cta-${blog.slug}`}>
          Read more <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
