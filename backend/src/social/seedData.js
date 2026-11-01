// Starting data for the EEC Social Engine, carried over from the n8n LinkedIn system
// (li_config, li_preferences, li_competitors, li_history) on 1 Nov 2026.
// scripts/social-build-seed.js turns this into sql/social_seed.sql.

const TONE_REFERENCE = `India's competitive rice market is creating new sourcing opportunities for international buyers. Are you making the most of them?

At the recent Bharat International Rice Conference, the vice president of the Indian Rice Exporters Federation highlighted India's strong pricing position, with Indian rice reportedly almost 10% more competitive than the next alternative.

With significant export volumes projected and opportunities opening across international markets, Indian rice exporters are well positioned to serve growing global demand.

For international buyers, the opportunity goes beyond securing a lower price. It is about using India's competitive market to negotiate better supply terms and build stronger supplier relationships.

When comparing Indian rice offers, focus on four factors:

→ Landed cost, not just FOB price: Compare freight, duties, testing, handling and other destination costs to understand the actual cost of procurement.

→ Specifications that match your market: Confirm grain length, broken percentage, moisture, crop year and packaging requirements before agreeing on price.

→ Destination-market compliance: Establish the testing, certifications and documentation required for your importing country before shipment.

→ Supplier capability and reliability: Evaluate export credentials, shipment experience, production or sourcing capacity and ability to meet agreed delivery schedules.

India's competitive rice prices create an opportunity to improve procurement margins, but the strongest deal is the one that delivers the right quality, at the right landed cost, consistently.

At EEC, we support international buyers through our paid Supplier Background Check and pre-shipment document review services, helping them make more informed sourcing decisions.

Exploring Indian rice sourcing opportunities for 2027?

DM "RICE" or email partners@eectrade.com.

EEC | Your India Sourcing Office

#IndiaSourcing #RiceExports #GlobalSourcing #FoodCommodities #Procurement #InternationalTrade`;

const config = [
  ["timezone", "Asia/Kolkata", "All times on the Studio page and in the cadence are in this timezone."],
  [
    "cadence",
    {
      linkedin_shirali: { days: ["mon", "wed", "fri"], time: "09:30", max_per_week: 3 },
      instagram: { days: ["tue", "thu", "sat"], time: "18:30", max_per_week: 3 },
      facebook: { days: ["tue", "thu", "sat"], time: "18:30", max_per_week: 3 },
      linkedin_company: { days: [], time: "12:30", max_per_week: 0 },
    },
    "Posting days and local times per channel. A channel with no days is off. Change on the Studio Settings tab.",
  ],
  ["publishing_enabled", true, "KILL SWITCH. false pauses every queued post in Buffer and blocks new scheduling."],
  ["dry_run", true, "SAFETY: while true, approving does not call Buffer; posts are marked as scheduled (dry run). Set false at go-live."],
  ["late_window_hours", 6, "A post approved after its time but within this many hours goes out straight away; later than that it is marked missed."],
  [
    "reminders",
    { enabled: true, interval_hours: 2, quiet_hours: "22:00-07:00", start_hours_before: 48 },
    "Approver reminder emails while posts are waiting, starting this many hours before the earliest slot.",
  ],
  ["notify_email", "harshp.eec@gmail.com", "Receives failures, missed posts and system alerts."],
  [
    "report_recipients",
    ["harshp.eec@gmail.com", "shirali@eectrade.com", "partners@eectrade.com"],
    "Receive the Sunday weekly report.",
  ],
  [
    "buffer_channels",
    { linkedin_shirali: "", instagram: "", facebook: "", linkedin_company: "" },
    "Buffer channel id per EEC channel. Filled from the Studio Settings tab after Buffer is connected.",
  ],
  ["buffer_organization_id", "", "Filled automatically from the Buffer account."],
  [
    "content_scope",
    ["Food and ingredients", "Agricultural commodities", "Seafood", "Apparel", "Home textiles"],
    "Only these categories. Anything else needs Shirali's confirmation first.",
  ],
  [
    "services",
    ["India Sourcing Feasibility Snapshot", "Supplier Background Check", "pre-shipment document review", "sourcing support for a buyer's requirement"],
    "The only EEC services posts may mention.",
  ],
  ["tone_reference", TONE_REFERENCE, "Final rice post (D-20261028-491a v2): the model for tone and practical buyer value."],
  ["brand", { navy: "#0D1B40", gold: "#B8952A", site: "https://www.eectrade.com" }, "Slide colours and site link."],
  ["audience_split", { buyer: 0.67, supplier: 0.33 }, "Proposed starting split, to confirm with the Business Team."],
];

// [approver, channel, rule_type, rule_text, status, evidence_count, example, updated_at]
const preferences = [
  ["all", "all", "brand", "When EEC's location is mentioned, describe it as Singapore-headquartered with an India procurement and operations team. Never Mumbai-based, India-headquartered or Singapore Registered.", "active", 1, "", "2026-10-25"],
  ["all", "all", "style", "No contractions. No em dashes or en dashes.", "active", 1, "", "2026-10-25"],
  ["all", "all", "claims", "No unverifiable claims and no absolute certification language (never 'all suppliers hold...'). State scope limits plainly, as the published posts do (customs confirmed with the buyer's broker; field checks scoped separately at additional cost).", "active", 1, "", "2026-10-25"],
  ["all", "all", "category", "Scope: write only about products and services EEC currently handles: food and ingredients, agricultural commodities, seafood, apparel and home textiles. Any other category (for example furniture, timber, wooden decor, healthcare products or PPE) needs Shirali's confirmation before drafting, so do not draft it. Describe sourcing as multi-country, not India-exclusive, unless the post is India-specific.", "active", 1, "", "2026-10-29"],
  ["all", "linkedin_shirali", "structure", "Open with a strong 1-2 line hook in bold Unicode that names a buyer opportunity or a useful, specific fact (never fear or blame). Short paragraphs of 1-2 sentences. Where useful, a list of 3-4 practical points using the arrow character with a label and a colon. One clear buyer takeaway line. Close with ONE call to action (DM a keyword, or partners@eectrade.com / www.eectrade.com) then the sign-off line 'EEC | Your India Sourcing Office'. Keep the post as short as the topic allows.", "active", 3, "Sample posts: rice exports, pre-shipment documents, supplier screening (supplied by Harsh 2026-10-25)", "2026-10-29"],
  ["all", "all", "hashtags", "4-7 hashtags at the end. #IndiaSourcing only on India-specific posts; otherwise #GlobalSourcing. Common set: #Procurement #SupplyChain #InternationalTrade plus 1-2 category tags (#FoodIngredients, #FoodCommodities, #AgriCommodities, #Seafood, #Apparel, #HomeTextiles, #PrivateLabel).", "active", 3, "", "2026-10-29"],
  ["all", "linkedin_shirali", "voice", "Company voice ('At EEC, we...') on Shirali's personal profile. Practical and specific, aimed at international procurement teams. Name EEC services by their names (India Sourcing Feasibility Snapshot, Supplier Background Check, pre-shipment document review) and give concrete scope or turnaround only when it is already published.", "active", 3, "", "2026-10-25"],
  ["all", "all", "claims", "The phrase '20+ years of India sourcing experience' appears in published posts. Reuse only that exact wording; never attach a founding year to EEC.", "candidate", 2, "", "2026-10-25"],
  ["Mohita", "all", "tone", "EEC promotes India as a sourcing destination: lead with India's strengths and opportunities rather than risks. Never imply Indian suppliers are unreliable or unfamiliar with international regulations. Compliance and testing points stay in, framed as smart buying practice, and scope limits and factual accuracy still apply.", "active", 1, "D-20261028-491a v1: rewrote rice post from 'cheap rice tempts buyers to skip checks' to 'how to use India's competitive rice market with confidence'.", "2026-10-27"],
  ["Mohita", "all", "hook", "Avoid hooks that link competitive Indian prices with supplier risk; prefer an opportunity-led hook aimed at buyers.", "active", 1, "Replaced 'Indian rice is cheap... buyers most tempted to skip the checks' with 'India's competitive rice market is creating new sourcing opportunities...'", "2026-10-29"],
  ["Mohita", "all", "cta", "Position EEC's paid services (Supplier Background Check, pre-shipment document review) as helping buyers make better, more informed sourcing decisions, not only as protection from risk.", "active", 1, "'we support international buyers through our paid Supplier Background Check and pre-shipment document review services, helping them make more informed sourcing decisions'", "2026-10-29"],
  ["Mohita", "all", "structure", "Make the buyer checklist practical commercial advice (landed cost vs FOB, specifications, destination-market compliance, supplier capability and reliability) rather than a list of warning signs.", "active", 1, "Rice post checklist changed from export status/residue testing/track record checks to landed cost, specs, compliance, supplier capability.", "2026-10-29"],
  ["all", "all", "topic", "Stay within EEC's scope. Cover only products and services we currently handle: food and ingredients, agricultural commodities, seafood, apparel and home textiles. Confirm any new category with Shirali before drafting. Do not include furniture, timber or wooden decor without approval.", "active", 1, "D-20261030-2299 (EUDR wooden furniture) rejected by Mohita on 29 Oct: only talk about products/services EEC does.", "2026-10-29"],
  ["all", "all", "audience", "Write for our buyers. Make the content useful to international buyers, importers and procurement teams. Explain how the topic affects their sourcing decisions.", "active", 1, "", "2026-10-29"],
  ["all", "all", "tone", "Keep the whole post positive and constructive. Avoid blame, fear-based messaging or negative generalisations about any country, supplier or market. Do not turn every post into a warning.", "active", 1, "Reference: final rice post D-20261028-491a v2 (opportunity-led).", "2026-10-29"],
  ["all", "all", "tone", "Avoid political commentary. Where trade policies or regulations are relevant, explain the practical business impact neutrally, without partisan views or sensational claims.", "active", 1, "", "2026-10-29"],
  ["all", "all", "length", "Be concise and clear. Use a strong opening, a few useful points and a clear buyer takeaway. Avoid repetition, jargon and long explanations. Keep posts as short as the topic allows.", "active", 1, "", "2026-10-29"],
  ["all", "all", "topic", "Focus on practical value. Help buyers understand opportunities, compare offers, clarify requirements or assess suppliers.", "active", 1, "Rice v2 checklist: landed cost vs FOB, specifications, destination-market compliance, supplier capability.", "2026-10-29"],
  ["all", "all", "claims", "Verify claims. Check facts, figures, dates and regulatory information against reliable sources. Clearly distinguish confirmed facts from opinions or possibilities.", "active", 1, "", "2026-10-29"],
  ["all", "all", "claims", "Represent EEC accurately. Mention only services we actually provide. Do not imply that we certify suppliers, provide legal clearance or guarantee delivery, savings or business results.", "active", 1, "", "2026-10-29"],
  ["all", "all", "cta", "Use one relevant call to action. Give the reader one clear next step, such as messaging EEC about a sourcing requirement or discussing a paid Supplier Background Check. Avoid competing CTAs.", "active", 1, "", "2026-10-29"],
  ["all", "all", "checklist", "Check before submitting: Is the topic within our scope? Is the message positive and useful? Are the claims supported? Is it easy to understand? Does the CTA fit the post?", "active", 1, "", "2026-10-29"],
  ["Mohita", "all", "claims", "EEC does not offer EUDR or other regulatory compliance services. On regulation-led topics, do not let the post read as if EEC provides compliance support: keep regulatory detail to a brief, neutral line, refer buyers to their compliance adviser, and lead with sourcing opportunity and supplier comparison instead.", "active", 1, "D-20261102-78a2 v1 (coffee EUDR): Mohita cut the EUDR detail and checklist to product, traceability and commercial terms, noting 'We do not offer EUDR Compliance which seemed like we do in earlier post'.", "2026-10-30"],
  // Starting points for the new channels. Marked candidate until the approver confirms them on the Learning tab.
  ["all", "instagram", "structure", "Instagram: the first caption line is the hook and must work on its own before 'more'. 600-1,200 characters. Links are not clickable, so write 'eectrade.com' and use a comment keyword as the call to action (for example 'Comment RICE and we will send the checklist'). Plain text, no bold Unicode. 5-6 hashtags.", "candidate", 0, "Based on EEC's own Instagram posts of Sep-Oct 2026 (SEA, FACTORY, three-markets carousel).", "2026-11-01"],
  ["all", "instagram", "structure", "Instagram carousels: 5-7 slides. Slide 1 is the hook (max 12 words), the middle slides carry one point each (title max 8 words, body max 30 words), the last slide is the takeaway and the call to action. Every slide must be readable on a phone without zooming.", "candidate", 0, "", "2026-11-01"],
  ["all", "facebook", "structure", "Facebook: same idea as the Instagram post on the same day, written as a short post of 400-900 characters with a clickable eectrade.com link carrying UTM tags. 3-5 hashtags.", "candidate", 0, "", "2026-11-01"],
];

const competitors = [
  ["Qualiground International", "https://www.linkedin.com/company/qualiground", "Direct competitor", "Independent on-ground supplier verification, pre-shipment inspection and container supervision across India", true, "Closest overlap with EEC Supplier Background Check. Active on LinkedIn with verification-vs-audit content."],
  ["QIMA", "https://www.qima.com/quality-control-india", "Industry leader", "Supplier audits, inspections and lab testing in India for brands and retailers", true, "Thought leadership on audits and compliance. Use for trend context, not tone."],
  ["GlobalLinker", "https://globallinker.com/", "Adjacent platform", "Verified Indian supplier marketplace with buyer guides on spices and food sourcing", true, "Publishes food commodity sourcing guides; watch for topics EEC can answer with more depth."],
  ["Vega Sourcing", "", "Direct competitor", "India sourcing, product development and QC for home furnishings and decor (est. 2003)", true, "URL to confirm. Watch only for home textiles and apparel themes. Furniture, timber and wooden decor are outside EEC's scope: do not use them as topics."],
  ["Innoterra", "https://indiaseatradenews.com/innoterra-to-scale-up-exports-of-basmati-rice-spices-from-india/", "Food commodity player", "Swiss-Indian platform scaling basmati rice and spice exports from India", true, "Company site to confirm. Relevant for rice and spice market signals."],
];

// [email, name, role]. Exactly one approver; change on the Studio Settings tab.
const members = [
  ["shirali@eectrade.com", "Shirali Shetty", "approver"],
  ["harshp.eec@gmail.com", "Harsh", "editor"],
  ["partners@eectrade.com", "Mohita Vadrevu", "viewer"],
  ["elanexports@gmail.com", "Elan", "editor"],
];

// The one post already live through n8n, so the never-repeat list and history start complete.
const publishedHistory = [
  {
    post_id: "D-20261026-f3c8-li",
    batch_id: "n8n-import-2026-10-26",
    week_start: "2026-10-26",
    channel: "linkedin_shirali",
    slot_at: "2026-10-26T09:40:03Z",
    kind: "text",
    pillar: "Home textiles",
    topic: "EU-India FTA: zero duty on Indian home textiles depends on supplier origin documentation",
    idea_key: "eu-india-fta-home-textiles-origin-documentation",
    external_url: "https://www.linkedin.com/feed/update/urn:li:share:7520418957737189376",
    posted_at: "2026-10-26T09:40:03Z",
  },
];

module.exports = { config, preferences, competitors, members, publishedHistory, TONE_REFERENCE };
