import Link from "next/link";
import Image from "next/image";
import CategoryBadge from "./CategoryBadge";

export default function BlogCard({ blog }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group block bg-[#FFFFFF]"
      data-testid={`blog-card-${blog.slug}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EFF4F9]">
        <Image
          src={blog.image}
          alt={blog.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="object-cover grayscale-[10%] group-hover:scale-[1.03] transition-transform duration-700"
        />
      </div>
      <div className="pt-5">
        <CategoryBadge category={blog.category} />
        <h4 className="font-display text-xl text-[#012D76] tracking-tight mt-3 group-hover:text-[#8A6F2B] transition-colors">
          {blog.title}
        </h4>
        <p className="mt-2 text-sm text-[#3A4759] leading-relaxed line-clamp-3">
          {blog.excerpt}
        </p>
      </div>
    </Link>
  );
}
