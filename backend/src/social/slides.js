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
        h("div", { fontSize: 34, fontWeight: 800, color: GOLD, letterSpacing: 4 }, "EEC"),
        h("div", { fontSize: 24, color: MUTED, marginLeft: 20 }, "eectrade.com")
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

async function renderSlide(slides, index, { quality = 88 } = {}) {
  const s = slides[index];
  if (!s) throw new Error(`No slide ${index + 1}`);
  const svg = await satori(frame(slideContent(s), { index, total: slides.length }), { width: W, height: H, fonts: loadFonts() });
  const img = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render();
  const { data } = jpeg.encode({ data: Buffer.from(img.pixels), width: img.width, height: img.height }, quality);
  return data;
}

module.exports = { renderSlide, W, H };
