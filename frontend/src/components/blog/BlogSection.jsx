"use client";

import { useMemo, useState } from "react";
import { getBlogs, getFeaturedBlog, BLOG_CATEGORIES } from "@/constants/blogData";
import CategoryTabs from "./CategoryTabs";
import FeaturedBlogCard from "./FeaturedBlogCard";
import BlogGrid from "./BlogGrid";

const TABS = ["All", ...BLOG_CATEGORIES];

export default function BlogSection() {
  const [activeCategory, setActiveCategory] = useState("All");

  // getBlogs()/getFeaturedBlog() read from the mock data file today; when the
  // automation/API integration lands, only that file's functions change.
  const allBlogs = useMemo(() => getBlogs(), []);
  const featured = useMemo(() => getFeaturedBlog(), []);

  const gridBlogs = useMemo(() => {
    const withoutFeatured = allBlogs.filter((b) => b.id !== featured?.id);
    if (activeCategory === "All") return withoutFeatured;
    return withoutFeatured.filter((b) => b.category === activeCategory);
  }, [allBlogs, featured, activeCategory]);

  return (
    <section className="py-20 lg:py-28 border-t hairline" data-testid="blog-section" aria-label="Blog and articles">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="mb-8">
          <span className="overline">Resources</span>
          <h2 className="font-display text-4xl lg:text-5xl text-[#012D76] mt-5 tracking-tight">
            Blog &amp; Articles
          </h2>
        </div>
        <div className="mb-12">
          <CategoryTabs categories={TABS} active={activeCategory} onChange={setActiveCategory} />
        </div>

        {featured && (
          <div className="pb-16 lg:pb-20 mb-16 lg:mb-20 border-b hairline">
            <FeaturedBlogCard blog={featured} />
          </div>
        )}

        <div className="mb-10">
          <span className="overline">Blog and articles</span>
          <h3 className="font-display text-2xl lg:text-3xl text-[#012D76] mt-4 tracking-tight">
            Latest insights and trends
          </h3>
        </div>

        <BlogGrid blogs={gridBlogs} />
      </div>
    </section>
  );
}
