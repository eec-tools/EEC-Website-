// Photos in posts. The writer generates a picture (Higgsfield) and puts its link in a slide's
// "photo". On submit the server downloads it once, turns it into a JPEG no wider than 1200px
// and keeps it in social_photos, so a post never depends on an outside link staying alive.
// Slides then carry "photo:<id>".
const crypto = require("crypto");
const { Resvg } = require("@resvg/resvg-js");
const jpeg = require("jpeg-js");
const HttpError = require("../utils/httpError");
const { getStore } = require("./store");

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_W = 1200;
const isRef = (v) => typeof v === "string" && /^photo:[a-f0-9]{8,40}$/.test(v);

function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { type: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) return null;
      const m = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { type: "jpeg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { type: "webp", width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { type: "webp", width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { type: "webp", width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

// Any PNG/JPEG/WebP to a JPEG at most MAX_W wide (resvg decodes, jpeg-js encodes).
function toJpeg(buf) {
  const size = imageSize(buf);
  if (!size || !size.width || !size.height) throw new HttpError(422, "The photo is not a PNG, JPEG or WebP image.");
  const w = Math.min(size.width, MAX_W);
  const hgt = Math.round((size.height * w) / size.width);
  const mime = size.type === "png" ? "image/png" : size.type === "webp" ? "image/webp" : "image/jpeg";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}"><image width="${w}" height="${hgt}" preserveAspectRatio="xMidYMid slice" xlink:href="data:${mime};base64,${buf.toString("base64")}"/></svg>`;
  const out = new Resvg(svg, { fitTo: { mode: "width", value: w } }).render();
  const { data } = jpeg.encode({ data: Buffer.from(out.pixels), width: out.width, height: out.height }, 86);
  return { data, width: out.width, height: out.height };
}

async function download(url) {
  if (!/^https:\/\/\S+$/i.test(url)) throw new HttpError(422, `Photo links must be https: ${String(url).slice(0, 80)}`);
  const host = new URL(url).hostname;
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || host.endsWith(".internal")) throw new HttpError(422, "That photo link is not allowed.");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) throw new HttpError(422, `Could not download the photo (HTTP ${res.status}). Generate it again or use another link.`);
    const len = Number(res.headers.get("content-length") || 0);
    if (len > MAX_BYTES) throw new HttpError(422, "The photo is larger than 15 MB.");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new HttpError(422, "The photo is larger than 15 MB.");
    return buf;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(422, `Could not download the photo: ${e.name === "AbortError" ? "it took too long" : e.message}.`);
  } finally {
    clearTimeout(timer);
  }
}

// Stores the photo behind a link (once) and returns "photo:<id>".
async function ingest(url, by = "claude") {
  if (isRef(url)) return url;
  const store = getStore();
  const id = crypto.createHash("sha1").update(String(url)).digest("hex").slice(0, 20);
  if (await store.get("social_photos", id)) return `photo:${id}`;
  const { data, width, height } = toJpeg(await download(url));
  await store.insert("social_photos", { id, source_url: String(url).slice(0, 1000), data: data.toString("base64"), width, height, added_by: by, created_at: new Date().toISOString() });
  return `photo:${id}`;
}

// Replaces every slide photo link with a stored reference. Errors name the slide.
async function ingestSlides(slides, by) {
  if (!Array.isArray(slides)) return slides;
  const out = [];
  for (const [i, s] of slides.entries()) {
    if (s && s.photo && !isRef(s.photo)) {
      try {
        out.push({ ...s, photo: await ingest(s.photo, by) });
      } catch (e) {
        throw new HttpError(e.status || 422, `Slide ${i + 1}: ${e.message}`);
      }
    } else out.push(s);
  }
  return out;
}

const cache = new Map();
async function dataUri(ref) {
  if (!isRef(ref)) return null;
  const id = ref.slice(6);
  if (cache.has(id)) return cache.get(id);
  const row = await getStore().get("social_photos", id).catch(() => null);
  const uri = row ? `data:image/jpeg;base64,${row.data}` : null;
  if (uri) {
    if (cache.size > 40) cache.delete(cache.keys().next().value);
    cache.set(id, uri);
  }
  return uri;
}

module.exports = { ingest, ingestSlides, dataUri, toJpeg, imageSize, isRef };
