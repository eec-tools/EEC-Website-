// Deterministic checks every post must pass on the server, whatever the writer and the
// checker said. "error" blocks submission and approval (the approver can override with a
// reason, which is logged); "warn" is shown on the Studio page.

// Platform facts behind these numbers are in docs/social-engine/platform-playbook.md.
// hookMax: characters visible before "see more" / "more" on a phone.
// tagCap: hard platform limit (Instagram allows 5 hashtags per post since December 2025).
const CHANNEL_RULES = {
  linkedin_shirali: { maxChars: 3000, softMax: 2000, tags: [3, 5], signOff: true, needsMedia: false, hookMax: 200 },
  linkedin_company: { maxChars: 3000, softMax: 2000, tags: [3, 5], signOff: true, needsMedia: false, hookMax: 200 },
  instagram: { maxChars: 2200, softMax: 1300, tags: [3, 5], tagCap: 5, signOff: false, needsMedia: true, hookMax: 125 },
  facebook: { maxChars: 5000, softMax: 1000, tags: [1, 3], signOff: false, needsMedia: false, hookMax: 125 },
};

// Engagement bait: asking for a comment word, a tag, a like or a share to push reach.
// Instagram says such posts may not be recommended; LinkedIn and Facebook demote it too.
const COMMENT_KEYWORD = /\b(?:[Cc]omment|[Tt]ype|[Dd]rop|[Rr]eply)\s+(?:with\s+)?(?:the\s+word\s+)?["“'‘]?[A-Z0-9]{2,}["”'’]?(?=[\s.,!:]|$)/;
const BAIT = /\b(?:like|share|repost|tag)\s+(?:this|if\b|someone|a friend|a colleague|\d+|two|three)|\bagree\s*\?|\bcomment\s+below\b|\bdrop\s+an?\s+emoji\b/i;

const SCORE_MIN = { stop: 8, useful: 8, true: 10, human: 8, ours: 9, clean: 10 };
const SIGN_OFF = "EEC | Your India Sourcing Office";

const CONTRACTION =
  /\b(?:\w+n['’]t|I['’](?:m|ve|ll|d)|(?:you|we|they|who|what|where|there|that|it|he|she|let|here|how)['’](?:re|ve|ll|d|s))\b/gi;
const OUT_OF_SCOPE = /\b(furniture|timber|wooden decor|wood decor|pharmaceutical|pharma|medical devices?)\b/gi;
const BAD_LOCATION = /\b(mumbai[- ]based|india[- ]headquartered|singapore[- ]registered|headquartered in mumbai|headquartered in india)\b/gi;
const ABSOLUTE = /\b(all (?:our |of our )?suppliers (?:are|hold|have)|fully certified suppliers|100% (?:verified|compliant|guaranteed))\b/gi;
const GUARANTEE = /\bguarantee(?:d|s)?\b/gi;
// Mathematical bold / sans-serif bold letters used for LinkedIn hooks.
const UNICODE_BOLD = /[\u{1D400}-\u{1D7FF}]/u;

function hashtags(text) {
  return (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).map((t) => t.trim());
}

function lintPost(post) {
  const out = [];
  const add = (level, code, message) => out.push({ level, code, message });
  const body = String(post.body || "");
  const rules = CHANNEL_RULES[post.channel];
  if (!rules) {
    add("error", "channel", `Unknown channel "${post.channel}"`);
    return out;
  }

  if (!body.trim()) add("error", "empty", "The post has no text.");
  if (body.length > rules.maxChars) add("error", "too_long", `${body.length} characters; the ${post.channel} limit is ${rules.maxChars}.`);
  else if (body.length > rules.softMax) add("warn", "long", `${body.length} characters; aim for under ${rules.softMax}.`);

  const contractions = [...new Set((body.match(CONTRACTION) || []).map((s) => s.toLowerCase()))];
  if (contractions.length) add("error", "contractions", `Contractions are not used in EEC writing: ${contractions.join(", ")}`);
  if (/[–—]/.test(body)) add("error", "dashes", "Em or en dash found. Use a colon, comma or full stop instead.");

  const loc = body.match(BAD_LOCATION);
  if (loc) add("error", "location", `EEC is Singapore-headquartered with an India procurement and operations team. Found: ${[...new Set(loc)].join(", ")}`);
  const scope = body.match(OUT_OF_SCOPE);
  if (scope) add("error", "scope", `Outside EEC's categories (needs Shirali's confirmation first): ${[...new Set(scope.map((s) => s.toLowerCase()))].join(", ")}`);
  const abs = body.match(ABSOLUTE);
  if (abs) add("error", "absolute_claim", `Absolute certification or verification language: ${[...new Set(abs)].join(", ")}`);
  if (GUARANTEE.test(body)) add("warn", "guarantee", "Mentions a guarantee. EEC never guarantees delivery, savings or results.");

  const tags = hashtags(body);
  const [lo, hi] = rules.tags;
  if (rules.tagCap && tags.length > rules.tagCap) add("error", "hashtags", `${tags.length} hashtags; ${post.channel} allows at most ${rules.tagCap}.`);
  else if (tags.length < lo || tags.length > hi) add(tags.length > hi + 3 ? "error" : "warn", "hashtags", `${tags.length} hashtags; ${post.channel} uses ${lo} to ${hi}.`);

  const firstLine = (body.split("\n").find((l) => l.trim()) || "").trim();
  if (rules.hookMax && [...firstLine].length > rules.hookMax)
    add("warn", "hook_length", `The opening line is ${[...firstLine].length} characters; only about ${rules.hookMax} show before "more" on a phone. Put the most useful point first and keep it shorter.`);

  if (COMMENT_KEYWORD.test(body))
    add(post.channel === "instagram" ? "error" : "warn", "engagement_bait", 'Asks for a comment keyword ("Comment RICE"). Platforms treat this as engagement bait and may stop recommending the post. Ask people to message us or email instead.');
  else if (BAIT.test(body)) add("warn", "engagement_bait", "Asks for likes, shares, tags or agreement. Ask a genuine question or give one clear next step instead.");

  const links = body.match(/https?:\/\/\S+/g) || [];
  if (post.channel === "facebook" && links.length)
    add("warn", "link_in_body", "Facebook is testing a limit of 2 link posts a month for Pages without Meta Verified. Write eectrade.com in the text instead of a full link.");
  if (post.channel.startsWith("linkedin") && links.length)
    add("warn", "link_in_body", "LinkedIn posts with links get less engagement. Give the full value in the post and end with a message or email call to action.");

  if (rules.signOff && !body.includes(SIGN_OFF)) add("warn", "sign_off", `Missing the sign-off line "${SIGN_OFF}".`);
  if (post.channel !== "linkedin_shirali" && post.channel !== "linkedin_company" && UNICODE_BOLD.test(body))
    add("warn", "unicode_bold", "Bold Unicode text is for LinkedIn only; screen readers cannot read it.");

  const imageCount = (post.slides || []).length || (post.media || []).length;
  if (rules.needsMedia && !imageCount) add("error", "media", "Instagram posts need at least one image, a carousel or a reel.");
  if (post.kind === "carousel") {
    if (imageCount < 2 || imageCount > 10) add("error", "carousel_size", `A carousel needs 2 to 10 slides; this one has ${imageCount}.`);
  }
  if (post.kind === "reel" && !(post.media || []).some((m) => /\.(mp4|mov)(\?|$)/i.test(m.url || m))) add("error", "reel_video", "A reel needs a public video URL (.mp4 or .mov).");
  if ((post.kind === "image" || post.kind === "carousel") && imageCount) {
    const alts = post.alt || [];
    if (alts.filter((a) => a && String(a).trim()).length < imageCount) add("warn", "alt_text", "Every image should have alt text.");
  }

  for (const [i, s] of (post.slides || []).entries()) {
    const words = (x) => String(x || "").split(/\s+/).filter(Boolean).length;
    if (words(s.title) > 14) add("error", "slide_title", `Slide ${i + 1}: title has ${words(s.title)} words (max 14).`);
    if (words(s.body) > 45) add("error", "slide_body", `Slide ${i + 1}: body has ${words(s.body)} words (max 45).`);
    if ((s.items || []).length > 5) add("error", "slide_items", `Slide ${i + 1}: more than 5 list items.`);
    const slideText = [s.kicker, s.title, s.body, s.cta, ...(s.items || []), s.value, s.label].filter(Boolean).join(" ");
    if (CONTRACTION.test(slideText)) add("error", "slide_contractions", `Slide ${i + 1}: contains a contraction.`);
    CONTRACTION.lastIndex = 0;
    if (/[–—]/.test(slideText)) add("error", "slide_dashes", `Slide ${i + 1}: contains an em or en dash.`);
  }

  const hasFigure = /\d[\d,.]*\s?(%|percent|million|billion|tonnes|crore|lakh)|\$\s?\d|\b(19|20)\d{2}\b/i.test(body);
  if (hasFigure && !(post.sources || []).length) add("error", "sources", "The post states figures or dates but lists no sources.");

  const claims = post.claims || [];
  const unverified = claims.filter((c) => c.verdict === "unverifiable");
  if (unverified.length) add("error", "fact_unverified", `The fact checker could not verify: ${unverified.map((c) => `"${c.text}"`).join("; ")}. Rewrite or remove it.`);
  if (hasFigure && !claims.some((c) => c.verdict)) add("warn", "fact_check", "The post states figures or dates that have not been through the fact checker.");

  const scores = post.scores || {};
  const low = Object.entries(SCORE_MIN).filter(([k, min]) => !(Number(scores[k]) >= min));
  if (low.length) add("error", "scores", `Checker scores below the minimum: ${low.map(([k, min]) => `${k} ${scores[k] ?? "missing"} (min ${min})`).join(", ")}`);

  CONTRACTION.lastIndex = 0;
  GUARANTEE.lastIndex = 0;
  return out;
}

const hasErrors = (lint) => lint.some((l) => l.level === "error");

// Adds UTM tags to eectrade.com links that do not have them, so site visits can be traced to a post.
function addUtm(body, { channel, campaign, content }) {
  const source = channel.startsWith("linkedin") ? "linkedin" : channel;
  return String(body).replace(/https?:\/\/(?:www\.)?eectrade\.com[^\s)\]]*/gi, (url) => {
    if (/[?&]utm_source=/.test(url)) return url;
    const trail = url.match(/[.,;:!?]+$/);
    const clean = trail ? url.slice(0, -trail[0].length) : url;
    const sep = clean.includes("?") ? "&" : "?";
    return `${clean}${sep}utm_source=${source}&utm_medium=social&utm_campaign=${encodeURIComponent(campaign)}${content ? `&utm_content=${encodeURIComponent(content)}` : ""}${trail ? trail[0] : ""}`;
  });
}

function ideaKey(topic) {
  return String(topic || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

module.exports = { lintPost, hasErrors, addUtm, ideaKey, hashtags, SCORE_MIN, CHANNEL_RULES, SIGN_OFF };
