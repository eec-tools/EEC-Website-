// Builds a PDF from JPEG pages (LinkedIn document posts). Each page embeds one JPEG as-is
// (DCTDecode), so no extra library is needed and the pages look exactly like the slides.
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function buildPdf(jpegs, { title = "EEC" } = {}) {
  const chunks = [];
  const offsets = [];
  let length = 0;
  const push = (data) => {
    const b = Buffer.isBuffer(data) ? data : Buffer.from(data, "binary");
    chunks.push(b);
    length += b.length;
  };
  const obj = (n, body) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    for (const part of [].concat(body)) push(part);
    push("\nendobj\n");
  };
  const esc = (s) => String(s).replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "");

  push("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
  const n = jpegs.length;
  // 1 catalog, 2 pages, 3 info, then per page: page, image, content
  const pageIds = jpegs.map((_, k) => 4 + k * 3);
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${n} >>`);
  obj(3, `<< /Title (${esc(title)}) /Producer (EEC Social Engine) >>`);
  jpegs.forEach((jpg, k) => {
    const size = jpegSize(jpg) || { width: 1080, height: 1350 };
    const w = (size.width * 72) / 144; // 1080 px -> 540 pt
    const h = (size.height * 72) / 144;
    const [pageId, imgId, contentId] = [4 + k * 3, 5 + k * 3, 6 + k * 3];
    obj(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${k} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    obj(imgId, [
      `<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`,
      jpg,
      "\nendstream",
    ]);
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im${k} Do Q`;
    obj(contentId, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  const xref = length;
  const total = 4 + n * 3;
  push(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let k = 1; k < total; k++) push(`${String(offsets[k]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return Buffer.concat(chunks);
}

module.exports = { buildPdf };
