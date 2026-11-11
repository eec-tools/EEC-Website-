// Renders structured slide data into 1080x1350 JPEGs in EEC brand colours.
// No browser: satori lays out the slide as SVG, resvg rasterises it, jpeg-js encodes it
// (Instagram's API only accepts JPEG). Slides are data, not HTML, so the layout can
// never overflow and every slide looks like it came from the same brand kit.
//
// Slide types:
//   cover { kicker?, title, body? }
//   point { number?, title, body }
//   list  { title, items: [..] }
//   stat  { value, label, source? }
//   cta   { title, body?, cta }
//   compare  { kicker?, title, columns: [a, b], rows: [{ label, a, b }] }   a/b: true, false or short text
//   question { kicker?, title (the question), body (the answer) }
//
// Every slide carries the EEC emblem and company name in the footer.

const fs = require("fs");
const path = require("path");
const satori = require("satori").default || require("satori");
const { Resvg } = require("@resvg/resvg-js");
const jpeg = require("jpeg-js");

const W = 1080;
const H = 1350;
const NAVY = "#0D1B40";
const NAVY_2 = "#16295C";
const GOLD = "#B8952A";
const GOLD_SOFT = "#E3CC8A";
const WHITE = "#FFFFFF";
const MUTED = "#C9D1E6";

let emblem = null;
function emblemUri() {
  if (!emblem) emblem = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, "assets", "eec-emblem.png")).toString("base64")}`;
  return emblem;
}

let fonts = null;
function loadFonts() {
  if (fonts) return fonts;
  const dir = path.join(__dirname, "assets");
  fonts = [
    { name: "Inter", data: fs.readFileSync(path.join(dir, "inter-latin-400-normal.woff")), weight: 400, style: "normal" },
    { name: "Inter", data: fs.readFileSync(path.join(dir, "inter-latin-600-normal.woff")), weight: 600, style: "normal" },
    { name: "Inter", data: fs.readFileSync(path.join(dir, "inter-latin-800-normal.woff")), weight: 800, style: "normal" },
  ];
  return fonts;
}

const h = (type, style, ...children) => ({
  type,
  props: { style: { display: "flex", ...style }, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false) },
});

// Shrinks type for longer text so nothing overflows.
function sizeFor(text, steps) {
  const n = String(text || "").length;
  for (const [maxLen, size] of steps) if (n <= maxLen) return size;
  return steps[steps.length - 1][1];
}

function frame(content, { index, total }) {
  return h(
    "div",
    { width: W, height: H, flexDirection: "column", backgroundColor: NAVY, fontFamily: "Inter", color: WHITE, padding: "84px 88px 72px" },
    h("div", { width: 120, height: 8, backgroundColor: GOLD, marginBottom: 56 }),
    h("div", { flexDirection: "column", flexGrow: 1, justifyContent: "center" }, content),
    h(
      "div",
      { justifyContent: "space-between", alignItems: "center", borderTop: `2px solid ${NAVY_2}`, paddingTop: 32 },
      h(
        "div",
        { alignItems: "center" },
        h(
          "div",
          { width: 76, height: 76, borderRadius: 38, backgroundColor: WHITE, alignItems: "center", justifyContent: "center" },
          { type: "img", props: { src: emblemUri(), width: 70, height: 70 } }
        ),
        h(
          "div",
          { flexDirection: "column", marginLeft: 20 },
          h("div", { fontSize: 26, fontWeight: 800, color: WHITE, letterSpacing: 1 }, "Elan Exports Consultancy"),
          h("div", { fontSize: 22, color: MUTED, marginTop: 4 }, "eectrade.com")
        )
      ),
      total > 1 ? h("div", { fontSize: 24, color: MUTED }, `${index + 1} / ${total}`) : null
    )
  );
}

function slideContent(s) {
  const type = s.type || "point";
  if (type === "cover") {
    return [
      s.kicker ? h("div", { fontSize: 30, fontWeight: 600, color: GOLD, letterSpacing: 3, textTransform: "uppercase", marginBottom: 36 }, s.kicker) : null,
      h("div", { fontSize: sizeFor(s.title, [[40, 92], [70, 78], [110, 66], [999, 56]]), fontWeight: 800, lineHeight: 1.1 }, s.title),
      s.body ? h("div", { fontSize: 36, color: MUTED, marginTop: 44, lineHeight: 1.4 }, s.body) : null,
    ];
  }
  if (type === "list") {
    return [
      h("div", { fontSize: sizeFor(s.title, [[40, 64], [80, 54], [999, 46]]), fontWeight: 800, lineHeight: 1.15, marginBottom: 48 }, s.title),
      ...(s.items || []).map((it) =>
        h(
          "div",
          { alignItems: "flex-start", marginBottom: 30 },
          h("div", { width: 18, height: 18, backgroundColor: GOLD, marginTop: 16, marginRight: 28, flexShrink: 0 }),
          h("div", { fontSize: sizeFor(it, [[60, 38], [120, 33], [999, 29]]), lineHeight: 1.35, color: WHITE }, it)
        )
      ),
    ];
  }
  if (type === "stat") {
    return [
      h("div", { fontSize: sizeFor(s.value, [[6, 200], [10, 150], [999, 110]]), fontWeight: 800, color: GOLD, lineHeight: 1 }, s.value),
      h("div", { fontSize: 44, fontWeight: 600, marginTop: 40, lineHeight: 1.25 }, s.label),
      s.source ? h("div", { fontSize: 24, color: MUTED, marginTop: 48 }, `Source: ${s.source}`) : null,
    ];
  }
  if (type === "compare") {
    const cols = (s.columns || ["", ""]).slice(0, 2);
    const cell = (v) =>
      h(
        "div",
        { width: 170, justifyContent: "center", alignItems: "center" },
        v === true
          ? h("div", { width: 30, height: 30, borderRadius: 15, backgroundColor: GOLD })
          : v === false || v == null || v === ""
            ? h("div", { width: 30, height: 4, backgroundColor: "#5B6A90" })
            : h("div", { fontSize: 26, color: GOLD_SOFT, textAlign: "center" }, String(v))
      );
    return [
      s.kicker ? h("div", { fontSize: 28, fontWeight: 600, color: GOLD, letterSpacing: 3, textTransform: "uppercase", marginBottom: 24 }, s.kicker) : null,
      h("div", { fontSize: sizeFor(s.title, [[50, 58], [90, 50], [999, 44]]), fontWeight: 800, lineHeight: 1.12, marginBottom: 40 }, s.title),
      h(
        "div",
        { borderBottom: `2px solid ${NAVY_2}`, paddingBottom: 14 },
        h("div", { flexGrow: 1 }),
        ...cols.map((c) => h("div", { width: 170, justifyContent: "center", fontSize: 24, color: MUTED, fontWeight: 600, textAlign: "center" }, c))
      ),
      ...(s.rows || []).slice(0, 7).map((r) =>
        h(
          "div",
          { alignItems: "center", paddingTop: 16, paddingBottom: 16, borderBottom: `1px solid ${NAVY_2}` },
          h("div", { flexGrow: 1, flexShrink: 1, fontSize: sizeFor(r.label, [[40, 31], [80, 27], [999, 24]]), lineHeight: 1.3, paddingRight: 16 }, r.label),
          cell(r.a),
          cell(r.b)
        )
      ),
    ];
  }
  if (type === "question") {
    return [
      h("div", { fontSize: 30, fontWeight: 600, color: GOLD, letterSpacing: 3, textTransform: "uppercase", marginBottom: 36 }, s.kicker || "A buyer asked us"),
      h("div", { fontSize: sizeFor(s.title, [[60, 66], [110, 56], [999, 48]]), fontWeight: 800, lineHeight: 1.15 }, `\u201c${s.title}\u201d`),
      h("div", { width: 90, height: 4, backgroundColor: GOLD, marginTop: 48, marginBottom: 40 }),
      s.body ? h("div", { fontSize: sizeFor(s.body, [[160, 38], [260, 33], [999, 29]]), color: GOLD_SOFT, lineHeight: 1.45 }, s.body) : null,
    ];
  }
  if (type === "cta") {
    return [
      h("div", { fontSize: sizeFor(s.title, [[40, 76], [80, 62], [999, 52]]), fontWeight: 800, lineHeight: 1.15 }, s.title),
      s.body ? h("div", { fontSize: 36, color: MUTED, marginTop: 40, lineHeight: 1.4 }, s.body) : null,
      h(
        "div",
        { marginTop: 64, backgroundColor: GOLD, color: NAVY, fontSize: 38, fontWeight: 800, padding: "28px 40px", alignSelf: "flex-start" },
        s.cta || "Message us at eectrade.com"
      ),
    ];
  }
  // point
  return [
    s.number ? h("div", { fontSize: 120, fontWeight: 800, color: GOLD, lineHeight: 1, marginBottom: 32 }, String(s.number)) : null,
    h("div", { fontSize: sizeFor(s.title, [[40, 68], [80, 56], [999, 48]]), fontWeight: 800, lineHeight: 1.15 }, s.title),
    s.body ? h("div", { fontSize: sizeFor(s.body, [[140, 40], [240, 35], [999, 31]]), color: GOLD_SOFT, marginTop: 40, lineHeight: 1.45 }, s.body) : null,
  ];
}

const v2 = require("./slidesV2");
const photos = require("./photos");
const AUDIENCE = { buyer: "For buyers", supplier: "For suppliers", both: "Buyers and suppliers" };

// opts.audience: the post's audience (buyer/supplier/both), shown as a pill on the new layouts.
async function renderSlide(slides, index, { quality = 88, audience } = {}) {
  const s = slides[index];
  if (!s) throw new Error(`No slide ${index + 1}`);
  const isNew = v2.TYPES.includes(s.type);
  const node = isNew
    ? v2.tree(s, { index, total: slides.length, audience: AUDIENCE[audience] || null, photo: s.photo ? await photos.dataUri(s.photo) : null })
    : frame(slideContent(s), { index, total: slides.length });
  const svg = await satori(node, { width: W, height: H, fonts: isNew ? v2.loadFonts() : loadFonts() });
  const img = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render();
  const { data } = jpeg.encode({ data: Buffer.from(img.pixels), width: img.width, height: img.height }, quality);
  return data;
}

module.exports = { renderSlide, W, H };
