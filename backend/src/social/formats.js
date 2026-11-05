// The ten post formats the engine rotates (see docs/social-engine/platform-playbook.md),
// and the audience segments every post is written for.

const FORMATS = {
  document: { label: "Document carousel (PDF)", kinds: ["document", "carousel"] },
  comparison: { label: "Comparison infographic", kinds: ["image"] },
  number: { label: "One-number infographic", kinds: ["image"] },
  market_update: { label: "Market update", kinds: ["text", "image"] },
  buyer_question: { label: "A buyer asked us", kinds: ["image", "text"] },
  checklist: { label: "Specification checklist", kinds: ["text", "carousel"] },
  calendar: { label: "Season and trade fair calendar", kinds: ["image", "carousel"] },
  service: { label: "Service walkthrough", kinds: ["document", "carousel"] },
  photo: { label: "Photos from the field", kinds: ["image", "carousel"] },
  video: { label: "Short explainer video", kinds: ["reel"] },
};

const SEGMENTS = {
  importer_distributor: { label: "Importers and distributors", audience: "buyer" },
  retail_chain: { label: "Retail and supermarket chains", audience: "buyer" },
  small_store: { label: "Small and independent stores", audience: "buyer" },
  private_label: { label: "Private-label brands and procurement teams", audience: "buyer" },
  manufacturer: { label: "Manufacturers, processors and exporters", audience: "supplier" },
};

module.exports = { FORMATS, SEGMENTS, FORMAT_KEYS: Object.keys(FORMATS), SEGMENT_KEYS: Object.keys(SEGMENTS) };
