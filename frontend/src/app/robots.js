const BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "*",
];

const DISALLOW = ["/admin", "/buyer", "/supplier", "/login", "/register", "/api/"];

export default function robots() {
  return {
    rules: BOTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: DISALLOW,
    })),
    sitemap: "https://www.eectrade.com/sitemap.xml",
  };
}
