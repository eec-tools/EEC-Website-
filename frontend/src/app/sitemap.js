import { getBlogs } from "@/constants/blogData";
import { fallbackCategories } from "@/constants/categoriesData";

const BASE_URL = "https://www.eectrade.com";

export default function sitemap() {
  const staticRoutes = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/for-buyers`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/for-suppliers`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/categories`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/services`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const categoryRoutes = fallbackCategories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug || c.anchor || c.id}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogRoutes = getBlogs().map((b) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    lastModified: new Date(b.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...blogRoutes];
}
