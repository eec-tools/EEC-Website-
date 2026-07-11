import BlogCard from "./BlogCard";

export default function BlogGrid({ blogs }) {
  if (!blogs.length) {
    return (
      <p className="text-[#6B7280] text-sm" data-testid="blog-grid-empty">
        No articles in this category yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12" data-testid="blog-grid">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}
