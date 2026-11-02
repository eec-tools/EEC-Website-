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
      { channel: "instagram", date: d(1), kind: "carousel", audience: "buyer", pillar: "Food and ingredients", topic: "Spice specification carousel", body: "A clear specification makes Indian spice quotes comparable.\n\nSwipe for the four points to put in your next enquiry.\n\nComment SPICE and we will send the checklist.\n\neectrade.com\n\n#Sourcing #Procurement #Spices #SupplyChain #FoodIngredients", slides, alt: slides.map((s) => s.title), scores: g, tests: "carousel vs single image" },
      { channel: "facebook", date: d(1), kind: "carousel", audience: "buyer", pillar: "Food and ingredients", topic: "Spice specification carousel", body: "A clear specification makes Indian spice quotes comparable. Four points to put in your next enquiry, from grade to shipment window.\n\nRead more at https://www.eectrade.com/services\n\n#Sourcing #Procurement #Spices", slides, alt: slides.map((s) => s.title), scores: g },
      { channel: "linkedin_company", date: d(2), kind: "text", audience: "buyer", market: "UK", pillar: "Apparel", topic: "UK apparel buyers: zero duty under the India-UK agreement rewards suppliers with origin records", body: li("𝗭𝗲𝗿𝗼 𝗱𝘂𝘁𝘆 𝗼𝗻 𝗜𝗻𝗱𝗶𝗮𝗻 𝗮𝗽𝗽𝗮𝗿𝗲𝗹 𝗶𝗻𝘁𝗼 𝘁𝗵𝗲 𝗨𝗞 𝗶𝘀 𝗮𝗻 𝗼𝗽𝗲𝗻𝗶𝗻𝗴 𝗳𝗼𝗿 𝗯𝘂𝘆𝗲𝗿𝘀 𝘄𝗵𝗼 𝗽𝗹𝗮𝗻 𝗳𝗼𝗿 𝗶𝘁.", "The UK-India trade agreement has applied since 15 July 2026.\n\nThe preferential rate depends on rules of origin and the documents that travel with each shipment.", "#IndiaSourcing #Apparel #Procurement #SupplyChain #InternationalTrade"), sources: [{ title: "UK Government: UK-India trade agreement", url: "https://www.gov.uk/", date: "2026-07-15", claim: "Agreement in force from 15 July 2026" }], verify_flags: "Confirm the entry into force date is still correct on the posting day.", scores: g },
      { channel: "linkedin_company", date: d(4), kind: "text", audience: "buyer", pillar: "Seafood", topic: "Frozen shrimp offers: comparing on glaze, count and cold chain", body: li("𝗖𝗼𝗺𝗽𝗮𝗿𝗶𝗻𝗴 𝗳𝗿𝗼𝘇𝗲𝗻 𝘀𝗵𝗿𝗶𝗺𝗽 𝗼𝗳𝗳𝗲𝗿𝘀 𝗴𝗲𝘁𝘀 𝗲𝗮𝘀𝗶𝗲𝗿 𝘄𝗵𝗲𝗻 𝘆𝗼𝘂 𝗮𝘀𝗸 𝘁𝗵𝗲 𝘀𝗮𝗺𝗲 𝘁𝗵𝗿𝗲𝗲 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻𝘀.", "Net weight after glaze, count per kilo and cold chain from plant to port decide what you actually receive.", "#IndiaSourcing #Seafood #Procurement #SupplyChain #InternationalTrade"), scores: g },
    ],
  });
  if (!r.ok) {
    console.error(JSON.stringify(r, null, 2));
    process.exit(1);
  }
  const app = buildApp();
  app.listen(port, () => console.log(`Studio demo API on http://localhost:${port} (login ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD})`));
})();
