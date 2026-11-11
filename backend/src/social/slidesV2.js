// The human post layouts (November 2026), designed with the core team: cream background, olive and
// yellow accents, the EEC emblem with the company name, big plain-language headlines.
//
// Every post follows five beats: the mistake the reader recognises, what it cost them, why it
// happens (explained simply), the exact fix, and a reason to save the post or send a keyword.
//
// Carousel slides
//   photo_cover      { kicker (a question to the reader), title, photo, cta? }          photo full-bleed
//   statement_cover  { kicker, title, accent?, cta? }                                    text only
//   why              { kicker?, title, accent?, good {title, items}, bad {title, items}, rule_label?, rule }
//   check            { step ("1 of 5"), name, icon?, title (the pain), body (why, in plain words),
//                      table? [{label, value}] | big? {value, caption} | swatches? [{color, label, note}] | good/bad?,
//                      ask_label?, ask }
//   saver            { kicker?, title, items, offer?, keyword? }
// Single images
//   mistake          { kicker, title, accent?, got_label?, got [..], why?, ask_label?, items [..], keyword?, photo? }
//   ready            { kicker, title, accent?, intro?, items [..], keyword?, photo? }
//   update           { badge, title, value (the date or number), meaning, source?, keyword? }
//   quotes           { kicker, title, accent?, columns [a, b]?, rows [{label}], close, keyword? }
//   goodbad          { kicker, title, accent?, good {title, text}, bad {title, text}, intro?, items?, keyword?, photo? }
// Any slide: audience pill ("For buyers" / "For suppliers") comes from the post.

const fs = require("fs");
const path = require("path");

const W = 1080;
const H = 1350;
const C = {
  bg: "#F7F3E6",
  ink: "#1B2547",
  sub: "#4A5068",
  dark: "#465C1E",
  soft: "#E4E9CF",
  acc: "#F2C230",
  line: "#E3DCC6",
  badge: "#DCE5C1",
  bad: "#B5532E",
  badSoft: "#F1E3DA",
  white: "#FFFFFF",
};
const TYPES = ["photo_cover", "statement_cover", "why", "check", "saver", "mistake", "ready", "update", "quotes", "goodbad"];
const SINGLE = ["mistake", "ready", "update", "quotes", "goodbad"];

const ICONS = {
  size: '<path d="M4 20 20 4M4 20v-6M4 20h6M20 4h-6M20 4v6"/>',
  colour: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="15" r="5"/>',
  weight: '<path d="M12 3v18M6 21h12M4 7h16"/><path d="M4 7 1.5 13a3 3 0 0 0 5 0zM20 7l-2.5 6a3 3 0 0 0 5 0z"/>',
  moisture: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>',
  pack: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  lab: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
  document: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
  ship: '<path d="M3 17l2 4h14l2-4H3zM5 17V11h14v6M9 11V6h6v5M12 3v3"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  wash: '<path d="M3 7h18l-2 13H5z"/><path d="M7 11c1.5 1.5 3 1.5 5 0s3.5-1.5 5 0"/>',
  thermometer: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>',
};
const ICON_KEYS = Object.keys(ICONS);
const GLYPH = { tick: '<path d="m5 12 5 5 9-10"/>', cross: '<path d="M6 6l12 12M18 6 6 18"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>' };
const svgUri = (inner, color) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  ).toString("base64")}`;

let emblem = null;
const emblemUri = () => emblem || (emblem = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, "assets", "eec-emblem.png")).toString("base64")}`);

let fonts = null;
function loadFonts() {
  if (fonts) return fonts;
  const dir = path.join(__dirname, "assets");
  fonts = [400, 500, 600, 700, 800].map((w) => ({ name: "Outfit", data: fs.readFileSync(path.join(dir, `outfit-latin-${w}-normal.woff`)), weight: w, style: "normal" }));
  return fonts;
}

const h = (type, style, ...children) => ({
  type,
  props: { style: { display: "flex", flexShrink: 0, ...style }, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false && c !== "") },
});
const img = (src, w, ht, style = {}) => ({ type: "img", props: { src, width: w, height: ht, style } });
function sizeFor(text, steps) {
  const n = String(text || "").length;
  for (const [maxLen, size] of steps) if (n <= maxLen) return size;
  return steps[steps.length - 1][1];
}

// ---------- parts ----------
function lockup({ onPhoto = false } = {}) {
  return h(
    "div",
    { alignItems: "center", ...(onPhoto ? { backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 60, padding: "12px 28px 12px 16px" } : {}) },
    img(emblemUri(), 76, 72),
    h(
      "div",
      { flexDirection: "column", marginLeft: 16, paddingLeft: 16, borderLeft: onPhoto ? "none" : `2px solid ${C.line}`, fontSize: 25, fontWeight: 700, color: C.ink, lineHeight: 1.15 },
      h("div", {}, "Élan Exports"),
      h("div", {}, "Consultancy")
    )
  );
}
const pill = (text) => h("div", { backgroundColor: C.dark, color: C.white, fontSize: 24, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", padding: "12px 22px", borderRadius: 40 }, text);
const kicker = (text, style = {}) => (text ? h("div", { fontSize: 28, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: C.dark, ...style }, text) : null);
function headline(title, accent, { big = [[30, 96], [50, 86], [80, 76], [999, 66]], style = {} } = {}) {
  const size = sizeFor(`${title || ""} ${accent || ""}`, big);
  return h(
    "div",
    { flexDirection: "column", fontSize: size, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, color: C.ink, ...style },
    h("div", { flexDirection: "column" }, ...lines(title)),
    accent ? h("div", { flexDirection: "column", color: C.dark }, ...lines(accent)) : null
  );
}
const subText = (text, style = {}) => (text ? h("div", { fontSize: sizeFor(text, [[90, 40], [160, 36], [999, 32]]), lineHeight: 1.3, color: C.sub, fontWeight: 500, ...style }, text) : null);
function askBox(label, text, style = {}) {
  if (!text) return null;
  return h(
    "div",
    { flexDirection: "column", backgroundColor: C.dark, color: C.white, borderRadius: 28, padding: "34px 42px", ...style },
    h("div", { fontSize: 24, letterSpacing: 4, textTransform: "uppercase", fontWeight: 800, color: C.acc, marginBottom: 10 }, label || "Ask for"),
    h("div", { fontSize: sizeFor(text, [[50, 42], [100, 38], [999, 34]]), lineHeight: 1.25, fontWeight: 600 }, text)
  );
}
function numbered(items, { size = 38, numBg = C.badge, numInk = C.dark } = {}) {
  return h(
    "div",
    { flexDirection: "column" },
    ...(items || []).slice(0, 5).map((t, i, a) =>
      h(
        "div",
        { alignItems: "center", padding: "20px 0", borderBottom: i < a.length - 1 ? `2px solid ${C.line}` : "none" },
        h("div", { width: 58, height: 58, borderRadius: 29, backgroundColor: numBg, color: numInk, fontSize: 28, fontWeight: 800, alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 24 }, String(i + 1)),
        h("div", { fontSize: sizeFor(t, [[40, size], [70, size - 4], [999, size - 8]]), fontWeight: 600, color: C.ink, lineHeight: 1.25, flexShrink: 1 }, t)
      )
    )
  );
}
function glyph(name, color, size) {
  return img(svgUri(GLYPH[name].replace("<path", '<path stroke-width="3"'), color), size, size);
}
function mark(ok, size = 54) {
  return h("div", { width: size, height: size, borderRadius: size / 2, backgroundColor: ok ? C.dark : C.bad, alignItems: "center", justifyContent: "center", flexShrink: 0 }, glyph(ok ? "tick" : "cross", C.white, Math.round(size * 0.55)));
}
// "\n" in a title starts a new line where the writer wants it.
const lines = (t) => String(t || "").split(/\n/).map((x) => h("div", {}, x.trim()));
function panels(good, bad, { text = true } = {}) {
  const panel = (ok, p) =>
    h(
      "div",
      { flexDirection: "column", flexGrow: 1, flexShrink: 1, flexBasis: 0, backgroundColor: ok ? C.soft : C.badSoft, borderRadius: 26, padding: "30px 32px", marginLeft: ok ? 0 : 22 },
      h("div", { alignItems: "center", fontSize: 36, fontWeight: 800, color: C.ink }, mark(ok, 50), h("div", { marginLeft: 14 }, (p && p.title) || (ok ? "Good" : "Bad"))),
      text && p && p.text ? h("div", { fontSize: 32, color: C.sub, marginTop: 14, lineHeight: 1.3 }, p.text) : null,
      p && p.items ? h("div", { flexDirection: "column", marginTop: 12 }, ...p.items.slice(0, 4).map((t) => h("div", { fontSize: 32, color: C.sub, lineHeight: 1.4 }, t))) : null
    );
  return h("div", { width: "100%" }, panel(true, good), panel(false, bad));
}
function ctaRow(keyword) {
  return h(
    "div",
    { marginTop: "auto", alignItems: "center", justifyContent: "space-between", borderTop: `2px solid ${C.line}`, paddingTop: 32 },
    keyword ? h("div", { backgroundColor: C.acc, color: C.ink, fontSize: 40, fontWeight: 800, letterSpacing: 1, padding: "22px 46px", borderRadius: 60 }, `DM ${keyword}`) : h("div", {}),
    h("div", { fontSize: 30, color: C.sub }, "More at ", h("div", { fontWeight: 800, color: C.ink, marginLeft: 8 }, "eectrade.com"))
  );
}
function dots(index, total) {
  return h(
    "div",
    { justifyContent: "center", marginTop: 30 },
    ...Array.from({ length: total }, (_, k) => h("div", { width: k === index ? 34 : 12, height: 12, borderRadius: 6, backgroundColor: k === index ? C.dark : C.line, marginLeft: 5, marginRight: 5 }))
  );
}
function photoBand(src, height) {
  return src ? h("div", { width: "100%", height, borderRadius: 26, overflow: "hidden", marginTop: 34 }, img(src, 912, height, { objectFit: "cover", width: 912, height })) : null;
}

// ---------- slides ----------
function page(children, { index, total, audience, single }) {
  const right = single || total <= 1 ? (audience ? pill(audience) : null) : h("div", { fontSize: 24, fontWeight: 700, color: C.sub, letterSpacing: 2 }, `${index + 1} / ${total}`);
  return h(
    "div",
    { width: W, height: H, flexDirection: "column", backgroundColor: C.bg, fontFamily: "Outfit", color: C.ink, padding: "72px 84px 70px" },
    h("div", { alignItems: "center", justifyContent: "space-between" }, lockup(), right),
    h("div", { flexDirection: "column", flexGrow: 1, flexShrink: 1 }, ...children),
    !single && total > 1 ? dots(index, total) : null
  );
}

function photoCover(s, ctx) {
  const shade = "linear-gradient(180deg, rgba(18,40,14,0.80) 0%, rgba(18,40,14,0.74) 30%, rgba(18,40,14,0) 62%)";
  return h(
    "div",
    { width: W, height: H, position: "relative", backgroundColor: C.dark, fontFamily: "Outfit" },
    ctx.photo ? img(ctx.photo, W, H, { position: "absolute", left: 0, top: 0, objectFit: "cover", width: W, height: H }) : null,
    h("div", { position: "absolute", left: 0, top: 0, width: W, height: H, backgroundImage: shade }),
    h(
      "div",
      { position: "absolute", left: 0, top: 0, width: W, height: H, flexDirection: "column", padding: "72px 84px 76px" },
      h("div", { alignItems: "center", justifyContent: "space-between" }, lockup({ onPhoto: true }), ctx.audience ? pill(ctx.audience) : null),
      s.kicker ? h("div", { marginTop: 54 }, h("div", { backgroundColor: C.acc, color: C.ink, fontSize: 44, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", padding: "12px 24px" }, s.kicker)) : null,
      h("div", { marginTop: 28, color: C.white, fontSize: sizeFor(s.title, [[40, 96], [60, 88], [90, 76], [999, 66]]), fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, maxWidth: 912, flexDirection: "column" }, ...lines(s.title)),
      h("div", { width: 120, height: 6, backgroundColor: C.acc, marginTop: 34, borderRadius: 3 }),
      ctx.total > 1
        ? h(
            "div",
            { marginTop: "auto", alignItems: "center", color: C.white, fontSize: 28, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" },
            h("div", { width: 76, height: 76, borderRadius: 38, backgroundColor: C.acc, color: C.ink, alignItems: "center", justifyContent: "center", fontSize: 38, marginRight: 16 }, glyph("arrow", C.ink, 38)),
            s.cta || "Swipe"
          )
        : null
    )
  );
}

function statementCover(s, ctx) {
  return page(
    [
      kicker(s.kicker, { marginTop: 110 }),
      headline(s.title, s.accent, { big: [[40, 96], [70, 90], [100, 80], [999, 70]], style: { marginTop: 24 } }),
      ctx.total > 1
        ? h(
            "div",
            { marginTop: "auto", alignItems: "center", fontSize: 30, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: C.ink },
            h("div", { width: 76, height: 76, borderRadius: 38, backgroundColor: C.acc, alignItems: "center", justifyContent: "center", fontSize: 38, marginRight: 18 }, glyph("arrow", C.ink, 38)),
            s.cta || "Swipe"
          )
        : null,
    ],
    { ...ctx, total: ctx.total }
  );
}

function why(s, ctx) {
  return page(
    [
      kicker(s.kicker || "Why it happens", { marginTop: 90 }),
      headline(s.title, s.accent, { big: [[40, 80], [70, 72], [999, 64]], style: { marginTop: 22 } }),
      h("div", { marginTop: 50 }, panels(s.good, s.bad)),
      askBox(s.rule_label || "The rule", s.rule, { marginTop: 40 }),
    ],
    ctx
  );
}

function visual(s) {
  if (Array.isArray(s.table) && s.table.length)
    return h(
      "div",
      { flexDirection: "column", marginTop: 30 },
      ...s.table.slice(0, 4).map((r) =>
        h("div", { justifyContent: "space-between", padding: "20px 0", borderBottom: `2px solid ${C.line}`, fontSize: 38 }, h("div", { fontWeight: 700, flexShrink: 1 }, r.label || ""), h("div", { fontWeight: 600, flexShrink: 1, marginLeft: 20 }, r.value || ""))
      )
    );
  if (s.big && s.big.value)
    return h(
      "div",
      { alignItems: "flex-end", marginTop: 20 },
      h("div", { fontSize: sizeFor(s.big.value, [[4, 230], [7, 180], [999, 130]]), fontWeight: 800, letterSpacing: -8, color: C.dark, lineHeight: 1 }, s.big.value),
      s.big.caption ? h("div", { fontSize: 34, color: C.sub, fontWeight: 500, marginLeft: 24, marginBottom: 24, maxWidth: 360, lineHeight: 1.2 }, s.big.caption) : null
    );
  if (Array.isArray(s.swatches) && s.swatches.length)
    return h(
      "div",
      { marginTop: 24 },
      ...s.swatches.slice(0, 3).map((w, i) =>
        h(
          "div",
          { flexDirection: "column", alignItems: "center", flexGrow: 1, flexShrink: 1, flexBasis: 0, marginLeft: i ? 22 : 0 },
          h("div", { width: "100%", height: 150, borderRadius: 22, backgroundColor: /^#[0-9a-f]{6}$/i.test(w.color || "") ? w.color : C.soft }),
          h("div", { fontSize: 32, fontWeight: 700, marginTop: 14 }, w.label || ""),
          w.note ? h("div", { fontSize: 28, color: C.sub }, w.note) : null
        )
      )
    );
  if (s.good || s.bad)
    return h(
      "div",
      { flexDirection: "column", marginTop: 20 },
      ...[
        [true, s.good],
        [false, s.bad],
      ]
        .filter(([, p]) => p)
        .map(([ok, p]) =>
          h(
            "div",
            { alignItems: "center", padding: "26px 30px", borderRadius: 22, backgroundColor: ok ? C.soft : C.badSoft, fontSize: 38, fontWeight: 600, marginTop: ok ? 0 : 16 },
            mark(ok, 56),
            h("div", { marginLeft: 22, flexShrink: 1 }, p.title || p.text || "")
          )
        )
    );
  return null;
}

function check(s, ctx) {
  const icon = ICONS[s.icon] ? svgUri(ICONS[s.icon], C.dark) : null;
  return page(
    [
      h(
        "div",
        { alignItems: "center", marginTop: 70 },
        icon ? h("div", { width: 92, height: 92, borderRadius: 46, backgroundColor: C.badge, alignItems: "center", justifyContent: "center", marginRight: 24 }, img(icon, 48, 48)) : null,
        h(
          "div",
          { flexDirection: "column" },
          s.step ? h("div", { fontSize: 28, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: C.dark }, `Check ${s.step}`) : null,
          s.name ? h("div", { fontSize: 46, fontWeight: 700, color: C.dark, lineHeight: 1.1 }, s.name) : null
        )
      ),
      h("div", { marginTop: 40, fontSize: sizeFor(s.title, [[28, 84], [45, 74], [999, 64]]), fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: C.ink, flexDirection: "column" }, ...lines(s.title)),
      subText(s.body, { marginTop: 22 }),
      visual(s),
      askBox(s.ask_label || "Ask for", s.ask, { marginTop: "auto" }),
    ],
    ctx
  );
}

function saver(s, ctx) {
  return page(
    [
      kicker(s.kicker || "Save this for your next order", { marginTop: 100 }),
      h(
        "div",
        { flexDirection: "column", marginTop: 36, backgroundColor: C.dark, borderRadius: 32, padding: "52px 50px", color: C.white },
        h("div", { fontSize: sizeFor(s.title, [[30, 62], [60, 54], [999, 46]]), fontWeight: 800, lineHeight: 1.15 }, s.title || ""),
        h(
          "div",
          { flexDirection: "column", marginTop: 20 },
          ...(s.items || []).slice(0, 5).map((t, i) => h("div", { fontSize: sizeFor(t, [[30, 44], [60, 38], [999, 34]]), lineHeight: 1.55, fontWeight: 600 }, h("div", { color: C.acc, marginRight: 18 }, String(i + 1)), h("div", { flexShrink: 1 }, t)))
        )
      ),
      h(
        "div",
        { marginTop: "auto", flexDirection: "column", alignItems: "center" },
        s.offer ? h("div", { fontSize: 36, color: C.sub, fontWeight: 500, marginBottom: 22 }, s.offer) : null,
        s.keyword ? h("div", { backgroundColor: C.acc, color: C.ink, fontSize: 48, fontWeight: 800, letterSpacing: 1, padding: "28px 70px", borderRadius: 60 }, `DM ${s.keyword}`) : null,
        h("div", { fontSize: 30, color: C.sub, marginTop: 22 }, "More at ", h("div", { fontWeight: 800, color: C.ink, marginLeft: 8 }, "eectrade.com"))
      ),
    ],
    ctx
  );
}

function mistake(s, ctx) {
  return page(
    [
      kicker(s.kicker, { marginTop: 54 }),
      headline(s.title, s.accent, { big: [[40, 84], [70, 78], [999, 68]], style: { marginTop: 16 } }),
      ctx.photo ? photoBand(ctx.photo, 300) : null,
      (s.got || []).length
        ? h(
            "div",
            { flexDirection: "column", marginTop: 30, backgroundColor: C.badSoft, borderRadius: 26, padding: "26px 34px" },
            h("div", { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: C.bad, textTransform: "uppercase" }, s.got_label || "What you got"),
            ...s.got.slice(0, ctx.photo ? 2 : 3).map((t) => h("div", { alignItems: "center", padding: "8px 0", fontSize: 36, fontWeight: 600 }, mark(false, 48), h("div", { marginLeft: 20, flexShrink: 1 }, t)))
          )
        : null,
      s.why ? h("div", { marginTop: 22, fontSize: 34, color: C.sub, lineHeight: 1.3 }, h("div", { fontWeight: 800, color: C.ink, marginRight: 10 }, "Why:"), h("div", { flexShrink: 1 }, s.why)) : null,
      (s.items || []).length
        ? h(
            "div",
            { flexDirection: "column", marginTop: 22, backgroundColor: C.dark, borderRadius: 26, padding: "28px 34px", color: C.white },
            h("div", { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: C.acc, textTransform: "uppercase" }, s.ask_label || "Do this instead"),
            ...s.items.slice(0, 3).map((t, i) => h("div", { fontSize: 36, fontWeight: 600, lineHeight: 1.5 }, h("div", { marginRight: 14 }, String(i + 1)), h("div", { flexShrink: 1 }, t)))
          )
        : null,
      ctaRow(s.keyword),
    ],
    { ...ctx, single: true }
  );
}

function ready(s, ctx) {
  return page(
    [
      kicker(s.kicker, { marginTop: 90 }),
      headline(s.title, s.accent, { big: [[40, 86], [70, 80], [999, 70]], style: { marginTop: 20 } }),
      ctx.photo ? photoBand(ctx.photo, 260) : null,
      subText(s.intro, { marginTop: 40 }),
      h("div", { marginTop: 14 }, numbered((s.items || []).slice(0, ctx.photo ? 3 : 4))),
      ctaRow(s.keyword),
    ],
    { ...ctx, single: true }
  );
}

function update(s, ctx) {
  return page(
    [
      h("div", { marginTop: 70 }, h("div", { backgroundColor: C.acc, color: C.ink, fontSize: 26, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", padding: "12px 24px", borderRadius: 12 }, s.badge || "Official update")),
      h("div", { marginTop: 34, fontSize: sizeFor(s.title, [[40, 88], [70, 76], [999, 64]]), fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }, s.title || ""),
      s.value ? h("div", { fontSize: sizeFor(s.value, [[7, 200], [10, 160], [999, 120]]), fontWeight: 800, letterSpacing: -8, lineHeight: 1, color: C.dark, marginTop: 6 }, s.value) : null,
      askBox("What it means for you", s.meaning, { marginTop: 40 }),
      s.source ? h("div", { fontSize: 24, color: C.sub, marginTop: 22 }, `Source: ${s.source}`) : null,
      ctaRow(s.keyword),
    ],
    { ...ctx, single: true }
  );
}

function quotes(s, ctx) {
  const cols = (s.columns && s.columns.length === 2 ? s.columns : ["Quote A", "Quote B"]).slice(0, 2);
  const rows = (s.rows || []).slice(0, 4).map((r) => (typeof r === "string" ? r : r.label));
  const card = (title, i) =>
    h(
      "div",
      { flexDirection: "column", flexGrow: 1, flexShrink: 1, flexBasis: 0, backgroundColor: C.white, border: `2px solid ${C.line}`, borderRadius: 26, padding: "30px 32px", marginLeft: i ? 22 : 0 },
      h("div", { fontSize: 34, fontWeight: 800, marginBottom: 14 }, title),
      ...rows.map((r) => h("div", { justifyContent: "space-between", fontSize: 32, padding: "16px 0", borderTop: `2px solid ${C.line}` }, h("div", { flexShrink: 1 }, r), h("div", { fontWeight: 800, color: C.bad }, "?")))
    );
  return page(
    [
      kicker(s.kicker, { marginTop: 90 }),
      headline(s.title, s.accent, { big: [[40, 88], [70, 80], [999, 70]], style: { marginTop: 20 } }),
      h("div", { marginTop: 54 }, ...cols.map(card)),
      s.close ? h("div", { marginTop: 40, fontSize: 40, lineHeight: 1.3, color: C.sub, fontWeight: 500 }, s.close) : null,
      ctaRow(s.keyword),
    ],
    { ...ctx, single: true }
  );
}

function goodbad(s, ctx) {
  return page(
    [
      kicker(s.kicker, { marginTop: 90 }),
      headline(s.title, s.accent, { big: [[40, 84], [70, 80], [999, 70]], style: { marginTop: 20 } }),
      ctx.photo ? photoBand(ctx.photo, 280) : null,
      h("div", { marginTop: 44 }, panels(s.good, s.bad)),
      subText(s.intro, { marginTop: 40 }),
      (s.items || []).length ? h("div", { marginTop: 10 }, numbered(s.items.slice(0, ctx.photo ? 2 : 3), { size: 36 })) : null,
      ctaRow(s.keyword),
    ],
    { ...ctx, single: true }
  );
}

const RENDER = { photo_cover: photoCover, statement_cover: statementCover, why, check, saver, mistake, ready, update, quotes, goodbad };

function tree(s, ctx) {
  return RENDER[s.type](s, ctx);
}

module.exports = { TYPES, SINGLE, ICON_KEYS, tree, loadFonts, W, H, C };
