// Mock blog data. This is the single file the automation/API integration will
// eventually replace — every function below (getBlogs, getBlogBySlug, etc.) is
// the seam: swap the body of these functions for a fetch() call later and no
// component in src/components/blog or the /blog/[slug] route needs to change.

export const BLOG_CATEGORIES = [
  "Business Strategies",
  "Client Success",
];

const blogs = [
  {
    id: "1",
    slug: "maximizing-efficiency-in-sourcing-operations",
    title: "Maximizing Efficiency in Sourcing Operations",
    excerpt:
      "We offer a comprehensive range of services designed to meet the unique needs of your business. From supplier qualification to landed cost modelling, our team is dedicated to driving your sourcing programme forward.",
    content: [
      "Sourcing efficiency is rarely about finding a cheaper factory. It is about removing the friction that sits between a buyer's requirement and a supplier's capability: unclear specifications, unverified compliance claims, and pricing that hides freight, duties and rework inside a single opaque number.",
      "At EEC, every sourcing sprint starts with a discovery call that maps target landed cost, order volume, compliance requirements and timelines before a single supplier is contacted. This front-loaded discipline is what lets us shortlist five to eight vetted suppliers within days rather than weeks.",
      "Open-book costing is the second lever. When a buyer can see factory price, freight, insurance, duties and last-mile delivery as separate line items, negotiation stops being adversarial and starts being a shared exercise in removing waste from the supply chain.",
      "The result is a sourcing programme that is not just cheaper on day one, but predictable on day ninety, and still holding up on day three hundred and sixty.",
    ],
    image: "/images/hero-container-ship.jpg",
    category: "Business Strategies",
    author: "Shirali Shetty",
    publishedAt: "2026-05-12",
    featured: true,
  },
  {
    id: "3",
    slug: "how-a-uk-retailer-cut-landed-cost-18-percent",
    title: "How a UK Retailer Cut Landed Cost by 18%",
    excerpt:
      "Discover strategies to streamline your business processes and enhance productivity, drawn from a real Engage-tier sourcing programme across two product categories.",
    content: [
      "A mid-size UK homeware retailer came to EEC with a familiar problem: their existing supplier relationships were profitable on paper, but landed cost kept drifting upward every quarter with no clear explanation.",
      "Over a six-week Engage-tier engagement, we rebuilt the landed cost model from scratch, line by line, across two categories: home textiles and eco-friendly packaging. Three cost components were quietly inflating the total: a freight consolidation fee never itemised separately, a compliance re-testing cost passed through without notice, and a currency buffer built into the unit price rather than disclosed.",
      "Once those three items were isolated and renegotiated on open-book terms with a newly qualified supplier bench, landed cost fell by eighteen percent within one shipment cycle, without changing product specification or quality standard.",
    ],
    image: "/images/categories/home-textile-apparel-hospitality.jpg",
    category: "Client Success",
    author: "Shovan Karmakar",
    publishedAt: "2026-04-09",
    featured: false,
  },
  {
    id: "5",
    slug: "why-open-book-costing-changes-supplier-negotiations",
    title: "Why Open-Book Costing Changes Supplier Negotiations",
    excerpt:
      "We offer a comprehensive range of services designed to meet the unique needs of your business, and open-book costing is the foundation all of them are built on.",
    content: [
      "Traditional sourcing intermediaries earn a margin buried inside the unit price, which means their incentive is to keep that number opaque. EEC works on a service fee model instead, which means the factory price, freight and duties can all be shown to the buyer as separate, auditable line items.",
      "This single change reframes the entire negotiation. Instead of a buyer trying to guess whether a quoted price is fair, both sides are looking at the same cost breakdown and negotiating the same three or four line items that actually move.",
      "Suppliers benefit too: open-book terms mean fewer renegotiations mid-order, because both sides agreed on the real cost structure before production started.",
    ],
    image: "/images/hero-suppliers.jpg",
    category: "Business Strategies",
    author: "Shirali Shetty",
    publishedAt: "2026-03-02",
    featured: false,
  },
];

/**
 * Returns every blog post, newest first.
 * SWAP POINT: replace the body of this function with an API/automation call
 * (e.g. `return fetch('/api/blogs').then(r => r.json())`) when ready. Every
 * caller already treats this as async-shaped data via the BlogSection state,
 * so no UI changes are required.
 */
export function getBlogs() {
  return [...blogs].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export function getFeaturedBlog() {
  return blogs.find((b) => b.featured) || getBlogs()[0];
}

export function getBlogBySlug(slug) {
  return blogs.find((b) => b.slug === slug) || null;
}

/**
 * Previous/next post relative to `slug`, ordered by publishedAt (newest first),
 * matching the order used everywhere else on the site.
 */
export function getAdjacentBlogs(slug) {
  const ordered = getBlogs();
  const index = ordered.findIndex((b) => b.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index < ordered.length - 1 ? ordered[index + 1] : null,
    next: index > 0 ? ordered[index - 1] : null,
  };
}
