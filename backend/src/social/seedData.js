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
      linkedin_company: { days: ["mon", "wed", "fri"], time: "09:30", max_per_week: 3 },
      instagram: { days: ["tue", "thu", "sat"], time: "18:30", max_per_week: 3 },
      facebook: { days: ["tue", "thu", "sat"], time: "18:30", max_per_week: 3 },
      linkedin_shirali: { days: [], time: "09:30", max_per_week: 0 },
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
  ["all", "linkedin_company", "structure", "Open with a 1-2 line hook in bold Unicode that leads with the most useful, specific point (never fear or blame) and fits in the first 200 characters, which is all a phone shows before 'see more'. Short paragraphs of 1-2 sentences. Where useful, a list of 3-4 practical points using the arrow character with a label and a colon, written so a buyer would save it. One clear buyer takeaway line. Give the full value in the post itself: no external links in the body, because posts with links get less engagement. Close with ONE call to action (message the EEC page with a keyword, or partners@eectrade.com) then the sign-off line 'EEC | Your India Sourcing Office'. 900 to 1,600 characters.", "active", 3, "Sample posts: rice exports, pre-shipment documents, supplier screening (supplied by Harsh 2026-10-25)", "2026-11-03"],
  ["all", "all", "hashtags", "Hashtags go at the end and help search, not reach (Instagram and LinkedIn both say so). LinkedIn 3-5, Instagram 3-5 (Instagram allows at most 5), Facebook 1-3. #IndiaSourcing only on India-specific posts; otherwise #GlobalSourcing. Pick from #Procurement #SupplyChain #InternationalTrade plus 1-2 category tags (#FoodIngredients, #FoodCommodities, #AgriCommodities, #Seafood, #Apparel, #HomeTextiles, #PrivateLabel).", "active", 3, "", "2026-11-03"],
  ["all", "linkedin_company", "voice", "Company voice ('At EEC, we...') on the EEC LinkedIn page. Practical and specific, aimed at international procurement teams. Name EEC services by their names (India Sourcing Feasibility Snapshot, Supplier Background Check, pre-shipment document review) and give concrete scope or turnaround only when it is already published.", "active", 3, "", "2026-10-25"],
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
  ["all", "all", "cta", "Use one relevant call to action. Give the reader one clear next step, such as messaging EEC about a sourcing requirement or discussing a paid Supplier Background Check. Avoid competing CTAs. Position EEC's paid services (Supplier Background Check, pre-shipment document review) as helping buyers make better, more informed sourcing decisions, not only as protection from risk. Never use engagement bait such as 'Comment RICE', 'Agree?', 'Tag a colleague', 'Like if' or 'Share this': all three platforms demote it. Ask people to message the EEC page with a keyword, email partners@eectrade.com, or answer one genuine question about their own sourcing.", "active", 1, "", "2026-11-03"],
  ["all", "all", "checklist", "Check before submitting: Is the topic within our scope? Is the message positive and useful? Are the claims supported? Is it easy to understand? Does the CTA fit the post?", "retired", 1, "", "2026-11-03"],
  ["Mohita", "all", "claims", "EEC does not offer EUDR or other regulatory compliance services. On regulation-led topics, do not let the post read as if EEC provides compliance support: keep regulatory detail to a brief, neutral line, refer buyers to their compliance adviser, and lead with sourcing opportunity and supplier comparison instead.", "active", 1, "D-20261102-78a2 v1 (coffee EUDR): Mohita cut the EUDR detail and checklist to product, traceability and commercial terms, noting 'We do not offer EUDR Compliance which seemed like we do in earlier post'.", "2026-10-30"],
  // Starting points for the new channels. Marked candidate until the approver confirms them on the Learning tab.
  ["all", "instagram", "structure", "Instagram caption: the first line is the hook, under 125 characters (all a phone shows before 'more'), and names the topic in plain search words (for example 'basmati rice', 'towel GSM'), because Instagram search reads captions more than hashtags. 300 to 900 characters, plain text, no bold Unicode. Links are not clickable, so write 'eectrade.com'. Call to action: message us a keyword ('Message us RICE for the checklist') or one genuine question. Never 'Comment RICE': Instagram may stop recommending posts that ask for comment keywords. Write something a buyer would send to a colleague: sends are Instagram's strongest signal for reaching new people. 3-5 hashtags.", "active", 0, "Instagram 5-hashtag cap (Dec 2025); comment-keyword CTAs can stop recommendation (Instagram @creators). See docs/social-engine/platform-playbook.md", "2026-11-03"],
  ["all", "instagram", "structure", "Instagram carousels: 5 to 10 slides. Slide 1 is the hook and promises what the swipe delivers (max 12 words). The middle slides carry one point each (title max 8 words, body max 30 words); the last slide is the takeaway and the call to action. Every slide must be readable on a phone without zooming. Carousels earn the most engagement per person reached; reels reach the most new people.", "candidate", 0, "", "2026-11-03"],
  ["all", "facebook", "structure", "Facebook: same idea and slides as the Instagram post that day. Hook in the first line, under 125 characters (all a phone shows before 'See more'). 300 to 800 characters. No link in the post text: Facebook is testing a limit of 2 link posts a month for Pages without Meta Verified, and links in comments are not limited. Write 'eectrade.com' in the text and put the full https://www.eectrade.com link in first_comment. 1-3 hashtags.", "active", 0, "Facebook link-post limit test for Pages (Dec 2025). See docs/social-engine/platform-playbook.md", "2026-11-03"],
  ["Platform research (Nov 2026)", "all", "hook", "Hooks: put the most interesting, useful point first (LinkedIn's own advice). Be specific: a product, a market, a date or a sourced number. Promise only what the post delivers. Patterns that suit EEC: a dated change ('From 1 January, ...'), a specific opportunity backed by a source, a question buyers ask us ('Why can two towel quotes describe different products?'), a short checklist ('Four details that make spice quotes comparable'). Never clickbait, fear, or a question the post does not answer.", "active", 1, "LinkedIn News (Laura Lorenzetti): put the most interesting part at the top.", "2026-11-03"],
  ["Platform research (Nov 2026)", "all", "format", "Original, first-party content only: EEC's own writing, data, slides and photos. Never repost or lightly edit other accounts' content, and never use images carrying another platform's watermark: Instagram and Facebook stop recommending accounts that mostly repost. Prefer real photos of EEC's work (samples, inspections, port or factory visits with permission) over stock or AI images, and label any photorealistic AI image as AI.", "active", 1, "Meta 'Rewarding Original Creators', Mar 2026; Instagram originality changes, 2026.", "2026-11-03"],
  ["Platform research (Nov 2026)", "all", "topic_more", "Topic focus: keep about 80% of posts on EEC's core subject (international buyers sourcing EEC's five categories from India and other origins) and the rest on two or three related subtopics (supplier assessment, documents and shipment, trade agreements). LinkedIn ranks accounts with a clear, consistent topic higher.", "candidate", 1, "Richard van der Blom, 2026 LinkedIn Algorithm Insights.", "2026-11-03"],
  ["Platform research (Nov 2026)", "instagram", "format", "Reels reach the most non-followers on Instagram and Facebook. When the team has real footage (samples, factory or port visits with permission), plan one reel a week: under 90 seconds (Instagram does not recommend longer reels to non-followers), the hook in the first 3 seconds, on-screen text, and original audio or a voiceover with real analysis.", "candidate", 1, "Instagram: reels over 90 seconds are not recommended to non-followers.", "2026-11-03"],
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
