// Post formats and the audience segments every post is written for.
//
// Since November 2026 every post follows the five beats the core team asked for: the mistake
// the reader recognises, what it cost them, why it happens (in plain words), the exact fix, and a
// reason to save the post or send a keyword. The first seven formats are the ones the writer uses;
// the older ten stay only so earlier posts and their results still show correctly.

const FORMATS = {
  // Current formats (layouts in slidesV2.js)
  checks_carousel: { label: "Checks carousel: photo cover, one check per slide, saver", kinds: ["carousel", "document"] },
  mistake_carousel: { label: "Mistake carousel: the moment they recognise, why it happens, the checks, saver", kinds: ["carousel", "document"] },
  mistake_card: { label: "Mistake card: one image, what went wrong and what to ask for", kinds: ["image"] },
  ready_list: { label: "Ready list: one image, the things to have ready", kinds: ["image"] },
  official_update: { label: "Official update: one image, the date or number and what it means for you", kinds: ["image"] },
  quote_compare: { label: "Quote comparison: one image, two quotes and the numbers to ask for", kinds: ["image"] },
  good_bad: { label: "Good against bad: one image, sample against bulk or right against wrong", kinds: ["image"] },
  // Earlier formats, no longer planned
  document: { label: "Document carousel (PDF)", kinds: ["document", "carousel"], retired: true },
  comparison: { label: "Comparison infographic", kinds: ["image"], retired: true },
  number: { label: "One-number infographic", kinds: ["image"], retired: true },
  market_update: { label: "Market update", kinds: ["text", "image"], retired: true },
  buyer_question: { label: "A buyer asked us", kinds: ["image", "text"], retired: true },
  checklist: { label: "Specification checklist", kinds: ["text", "carousel"], retired: true },
  calendar: { label: "Season and trade fair calendar", kinds: ["image", "carousel"], retired: true },
  service: { label: "Service walkthrough", kinds: ["document", "carousel"], retired: true },
  photo: { label: "Photos from the field", kinds: ["image", "carousel"], retired: true },
  video: { label: "Short explainer video", kinds: ["reel"], retired: true },
};

// Which slide layouts each current format is built from (checked on submit).
const FORMAT_SLIDES = {
  checks_carousel: { first: ["photo_cover", "statement_cover"], middle: ["check", "why"], last: ["saver"] },
  mistake_carousel: { first: ["photo_cover", "statement_cover"], middle: ["why", "check"], last: ["saver"] },
  mistake_card: { only: "mistake" },
  ready_list: { only: "ready" },
  official_update: { only: "update" },
  quote_compare: { only: "quotes" },
  good_bad: { only: "goodbad" },
};

const SEGMENTS = {
  importer_distributor: { label: "Importers and distributors", audience: "buyer" },
  retail_chain: { label: "Retail and supermarket chains", audience: "buyer" },
  small_store: { label: "Small and independent stores", audience: "buyer" },
  private_label: { label: "Private-label brands and procurement teams", audience: "buyer" },
  manufacturer: { label: "Manufacturers, processors and exporters", audience: "supplier" },
};

const CURRENT_FORMATS = Object.keys(FORMATS).filter((k) => !FORMATS[k].retired);

module.exports = { FORMATS, FORMAT_SLIDES, SEGMENTS, CURRENT_FORMATS, FORMAT_KEYS: Object.keys(FORMATS), SEGMENT_KEYS: Object.keys(SEGMENTS) };
