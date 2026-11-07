// Local demo of the Social Studio with sample posts. Nothing leaves your machine:
// in-memory database, dry run on, no Buffer key.
//
//   cd backend && JWT_SECRET=dev node scripts/studio-demo.js
//   cd frontend && NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 yarn dev
//   open http://localhost:3000/login  ->  demo@eectrade.com / Demo-Pass-123!  ->  /studio
process.env.USE_IN_MEMORY_DB = "1";
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "demo@eectrade.com";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Demo-Pass-123!";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || "http://localhost:3000";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const port = Number(process.env.PORT || 8000);
process.env.SOCIAL_PUBLIC_BASE_URL = process.env.SOCIAL_PUBLIC_BASE_URL || `http://localhost:${port}`;

const bootstrap = require("../src/bootstrap");
const buildApp = require("../src/app");
const { getStore } = require("../src/social/store");
const seed = require("../src/social/seedData");
const service = require("../src/social/service");
const { mondayOf, addDays, localParts } = require("../src/social/time");

const g = { stop: 9, useful: 9, true: 10, human: 9, ours: 9, clean: 10 };

(async () => {
  await bootstrap();
  const store = getStore();
  for (const [key, value, notes] of seed.config) await store.upsert("social_config", { key, value, notes });
  for (const [approver, channel, rule_type, rule_text, status, evidence_count, example] of seed.preferences)
    await store.insert("social_preferences", { approver, channel, rule_type, rule_text, status, evidence_count, example });
  for (const [email, name, role] of [[process.env.ADMIN_EMAIL, "Demo Approver", "approver"], ["harshp.eec@gmail.com", "Harsh", "editor"], ["partners@eectrade.com", "Mohita Vadrevu", "viewer"]])
    await store.upsert("social_members", { email, name, role, active: true });

  const monday = addDays(mondayOf(localParts(new Date(), "Asia/Kolkata").date), 7);
  const d = (n) => addDays(monday, n);
  const li = (hook, body, tags) =>
    `${hook}\n\n${body}\n\nAt EEC, we support international buyers through our paid Supplier Background Check, helping them make more informed sourcing decisions.\n\nDM "SPICE" or email partners@eectrade.com.\n\nEEC | Your India Sourcing Office\n\n${tags}`;
  const slides = [
    { type: "cover", kicker: "Indian spices", title: "A clear specification makes spice quotes comparable", body: "Four points for your next enquiry" },
    { type: "point", number: 1, title: "Name the grade and origin", body: "State variety, grade and growing region so every quote covers the same product." },
    { type: "list", title: "Confirm before you compare offers", items: ["Moisture and volatile oil content", "Residue limits for your market", "Packing, labelling and shelf life", "Shipment window and Incoterm"] },
    { type: "cta", title: "Planning spice sourcing for 2027?", body: "Share your specification and volumes.", cta: "Comment SPICE" },
  ];
  const r = await service.submitBatch({
    week_start: monday,
    plan: { theme: "Turning India's range into clear, comparable offers" },
    experiment: "Instagram carousel against a single image: compare saves per 1,000 reached",
    qa_summary: { lesson: "Lead the Wednesday hook with the buyer outcome, not the regulation." },
    posts: [
      { channel: "linkedin_company", date: d(0), kind: "text", audience: "buyer", market: "EU", pillar: "Food and ingredients", series: "Buyer asks, no. 3", topic: "Indian spices: a clear specification turns India's wide range into an advantage", body: li("𝗜𝗻𝗱𝗶𝗮'𝘀 𝘀𝗽𝗶𝗰𝗲 𝗿𝗮𝗻𝗴𝗲 𝗶𝘀 𝗮 𝗿𝗲𝗮𝗹 𝗮𝗱𝘃𝗮𝗻𝘁𝗮𝗴𝗲 𝗳𝗼𝗿 𝗯𝘂𝘆𝗲𝗿𝘀 𝘄𝗵𝗼 𝘀𝗽𝗲𝗰𝗶𝗳𝘆 𝗰𝗹𝗲𝗮𝗿𝗹𝘆.", "When two offers describe the same spice differently, you cannot compare them.\n\n→ Grade and origin: name the variety and region.\n→ Quality limits: moisture, volatile oil and residue limits for your market.\n→ Packing and shelf life.\n→ Shipment window and Incoterm.\n\nA clear specification turns a long list of quotes into a short list of real options.", "#IndiaSourcing #FoodIngredients #Procurement #SupplyChain #InternationalTrade"), verify_flags: "None", scores: g },
      { channel: "instagram", date: d(1), kind: "carousel", audience: "buyer", pillar: "Food and ingredients", topic: "Spice specification carousel", body: "A clear specification makes Indian spice quotes comparable.\n\nSwipe for the four points to put in your next enquiry.\n\nMessage us SPICE to discuss your requirement.\n\neectrade.com\n\n#Sourcing #Procurement #Spices #SupplyChain #FoodIngredients", slides, alt: slides.map((s) => s.title), scores: g, tests: "carousel vs single image" },
      { channel: "facebook", date: d(1), kind: "carousel", audience: "buyer", pillar: "Food and ingredients", topic: "Spice specification carousel", body: "A clear specification makes Indian spice quotes comparable. Four points to put in your next enquiry, from grade to shipment window.\n\nRead more at https://www.eectrade.com/services\n\n#Sourcing #Procurement #Spices", slides, alt: slides.map((s) => s.title), scores: g },
      { channel: "linkedin_company", date: d(2), kind: "text", audience: "buyer", market: "UK", pillar: "Apparel", topic: "UK apparel buyers: zero duty under the India-UK agreement rewards suppliers with origin records", body: li("𝗭𝗲𝗿𝗼 𝗱𝘂𝘁𝘆 𝗼𝗻 𝗜𝗻𝗱𝗶𝗮𝗻 𝗮𝗽𝗽𝗮𝗿𝗲𝗹 𝗶𝗻𝘁𝗼 𝘁𝗵𝗲 𝗨𝗞 𝗶𝘀 𝗮𝗻 𝗼𝗽𝗲𝗻𝗶𝗻𝗴 𝗳𝗼𝗿 𝗯𝘂𝘆𝗲𝗿𝘀 𝘄𝗵𝗼 𝗽𝗹𝗮𝗻 𝗳𝗼𝗿 𝗶𝘁.", "The UK-India trade agreement has applied since 15 July 2026.\n\nThe preferential rate depends on rules of origin and the documents that travel with each shipment.", "#IndiaSourcing #Apparel #Procurement #SupplyChain #InternationalTrade"), sources: [{ title: "UK Government: UK-India trade agreement", url: "https://www.gov.uk/", date: "2026-07-15", claim: "Agreement in force from 15 July 2026" }], verify_flags: "Confirm the entry into force date is still correct on the posting day.", scores: g },
      { channel: "linkedin_company", date: d(4), kind: "text", audience: "buyer", pillar: "Seafood", topic: "Frozen shrimp offers: comparing on glaze, count and cold chain", body: li("𝗖𝗼𝗺𝗽𝗮𝗿𝗶𝗻𝗴 𝗳𝗿𝗼𝘇𝗲𝗻 𝘀𝗵𝗿𝗶𝗺𝗽 𝗼𝗳𝗳𝗲𝗿𝘀 𝗴𝗲𝘁𝘀 𝗲𝗮𝘀𝗶𝗲𝗿 𝘄𝗵𝗲𝗻 𝘆𝗼𝘂 𝗮𝘀𝗸 𝘁𝗵𝗲 𝘀𝗮𝗺𝗲 𝘁𝗵𝗿𝗲𝗲 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻𝘀.", "Net weight after glaze, count per kilo and cold chain from plant to port decide what you actually receive.", "#IndiaSourcing #Seafood #Procurement #SupplyChain #InternationalTrade"), scores: g },
    ],
  });
  if (!r.ok) {
    console.error(JSON.stringify(r, null, 2));
    process.exit(1);
  }
  // Show the newer screens with something in them: a change request, competitors, an enquiry, a run.
  const demoMember = { email: process.env.ADMIN_EMAIL, name: "Demo Approver", role: "approver" };
  const studioData = require("../src/social/studioData");
  const { audit } = require("../src/social/settings");
  const ig = r.posts.find((p) => p.channel === "instagram");
  await service.requestChange(demoMember, ig.post_id, { note: "Fewer slides and a warmer ending", visuals: true });
  await studioData.saveCompetitor(demoMember, "companies", { name: "QIMA", url: "https://www.qima.com", category: "Industry leader", focus: "Audits, inspections and lab testing" });
  await studioData.saveCompetitor(demoMember, "posts", { author: "Example company", author_type: "company", format: "Document, 8 pages", reactions: "140 reactions, 22 comments", hook: "Eight things our auditors found last quarter", body: "Example post text pasted from LinkedIn." });
  await studioData.saveEnquiry(demoMember, { channel: "linkedin", keyword: "SPICE", company: "Example Foods LLC", country: "UAE", audience: "buyer", product: "Cumin", status: "qualified" });
  // Competitor watch and learning decisions.
  const watch = require("../src/social/competitorWatch");
  const learning = require("../src/social/learning");
  const found = await watch.saveFindings({
    competitor: "QIMA",
    kind: "company",
    profile: { focus: "Audits, inspections, lab testing; monthly food safety webinars" },
    summary: "Monthly food safety webinars, and recap documents shared a few days after each one.",
    posts: [{ url: "https://www.qima.com/blog", posted_on: "2026-11-03", format: "article", hook: "Five findings from our October food audits", summary: "A short recap of common audit findings, with one chart.", why_it_works: "Specific, dated and useful to buyers; one chart carries the main point; it ends with a single next step." }],
    learnings: [
      { text: "Recap documents of 6 to 8 pages, posted a few days after an event, get shared by buyers. EEC could post a short recap after each trade fair it attends.", domain: "social", channel: "linkedin_company", rule_type: "format", evidence: [{ title: "QIMA blog", url: "https://www.qima.com/blog" }] },
      { text: "QIMA leads with lab testing for food buyers. EEC could explain how it works with independent labs during a Supplier Background Check, without offering testing itself.", domain: "business", rule_type: "service", evidence: [{ title: "QIMA quality control India", url: "https://www.qima.com/quality-control-india" }] },
    ],
  });
  await learning.decide("competitor", found.learnings_added[0].id, "confirm", "Seen in two QIMA posts this month and it matches our document format, which suits buyers saving checklists.", "writer");
  const [hookRule] = await store.insert("social_preferences", { approver: "all", channel: "linkedin_company", rule_type: "hook", domain: "social", rule_text: "Put the product and the market in the first line.", status: "candidate", evidence_count: 2, updated_at: new Date().toISOString() });
  await learning.decide("rule", hookRule.id, "confirm", "Both posts that named product and market in line 1 had the most impressions this week; matches LinkedIn's own advice.", "writer");
  await store.insert("social_preferences", { approver: "Mohita", channel: "all", rule_type: "claims", domain: "business", rule_text: "Do not mention years of experience until the exact wording is agreed.", status: "candidate", evidence_count: 1, example: "Edit on 4 Nov: removed '20+ years'", updated_at: new Date().toISOString() });
  await audit("claude", "job.research", null, { summary: "Filed 4 findings on spice residue limits and the rice crop", sources: [{ title: "Spices Board of India", url: "https://www.indianspices.com/", date: "2026-11-01", used_for: "research note" }] });
  // Published posts with results over the last 8 weeks, so Insights has something to show.
  {
    const store = require("../src/social/store").getStore();
    const fmts = ["document", "comparison", "checklist", "market_update", "number"];
    const chans = ["linkedin_company", "linkedin_company", "instagram", "facebook"];
    for (let w = 8; w >= 1; w -= 1) {
      for (let k = 0; k < 3; k += 1) {
        const ch = chans[(w + k) % chans.length];
        const imp = Math.round((ch === "linkedin_company" ? 420 : ch === "instagram" ? 220 : 90) * (1 + (8 - w) * 0.12) * (0.8 + k * 0.2));
        await store.insert("social_posts", {
          post_id: `demo-past-${w}-${k}`,
          batch_id: "demo-past",
          channel: ch,
          slot_at: new Date(Date.now() - (w * 7 - k * 2) * 86400000).toISOString(),
          status: "posted",
          kind: "text",
          pillar: ["Food and ingredients", "Seafood", "Home textiles"][k],
          format: fmts[(w + k) % fmts.length],
          topic: ["Basmati specification checklist", "Frozen shrimp: glaze and count", "Towel GSM explained", "Landed cost in 6 steps", "India-EU FTA: what changes"][(w + k) % 5],
          body: "Example published post.",
          version: 1,
          metrics: { impressions: imp, reactions: Math.round(imp * 0.03), comments: Math.round(imp * 0.004), saves: Math.round(imp * 0.006), clicks: Math.round(imp * 0.01) },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  // Outreach: buyers and drafted comments.
  const outreach = require("../src/social/outreach");
  const pid = (iso) => (BigInt(Date.parse(iso)) << 22n).toString();
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const tg = await outreach.saveTargets(
    [
      { name: "Veetee Group", linkedin_url: "https://uk.linkedin.com/company/veetee-foods-ltd", market: "UK", category: "basmati rice", reason: "UK rice brand; posts weekly about harvest and retail" },
      { name: "East End Foods", linkedin_url: "https://uk.linkedin.com/company/east-end-foods", market: "UK", category: "spices, rice", reason: "UK importer and brand of Indian foods" },
      { name: "Westmill Foods", linkedin_url: "https://uk.linkedin.com/company/westmill-foods", market: "UK", category: "rice, flour", reason: "Part of Associated British Foods" },
    ],
    "writer"
  );
  const ids = tg.added.map((x) => x.id);
  await outreach.submitComments({
    checked_targets: ids.map((id) => ({ id })),
    comments: [
      { target_id: ids[0], post_url: `https://www.linkedin.com/posts/veetee-foods-ltd_veetee-rice-growth-activity-${pid(daysAgo(1))}-t_lc`, post_excerpt: "Veetee shares growth in its UK retail rice range and thanks its farming partners.", reactions: 103, comments: 5, why_picked: "UK rice brand that sources basmati from India; growth means new supply questions.", angle: "question", comment: "Congratulations on the growth. With the new basmati crop arriving, are you seeing UK shoppers move towards smaller packs, or is the 5 kg bag still the main seller?" },
      { target_id: ids[1], post_url: `https://www.linkedin.com/posts/east-end-foods_spices-activity-${pid(daysAgo(2))}-ab12`, post_excerpt: "East End Foods introduces its new range of whole spices for UK supermarkets.", reactions: 48, comments: 2, why_picked: "Importer of Indian spices launching a new line.", angle: "tip", comment: "A strong range. For whole spices headed to UK shelves, asking each supplier for a recent pesticide residue report against GB limits, per lot rather than per year, avoids most hold-ups at the port." },
    ],
  });
  const app = buildApp();
  app.listen(port, () => console.log(`Studio demo API on http://localhost:${port} (login ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD})`));
})();
