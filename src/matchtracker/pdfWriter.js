// Tennis Tracker — minimalny zapis PDF: każda strona to jeden obraz JPEG na
// całą stronę A4. Bez bibliotek; polskie znaki działają, bo tekst jest
// narysowany wcześniej na canvasie.
const A4_W = 595.28, A4_H = 841.89;

const enc = new TextEncoder();
const bytes = (s) => enc.encode(s);

/**
 * @param {{ data: Uint8Array, width: number, height: number }[]} pages obrazy JPEG
 * @returns {Uint8Array}
 */
export function buildPdf(pages) {
  const chunks = [];
  const offsets = [];
  let pos = 0;
  const push = (u8) => { chunks.push(u8); pos += u8.length; };
  const obj = (n, body) => { offsets[n] = pos; push(bytes(`${n} 0 obj\n`)); push(typeof body === "string" ? bytes(body) : body); push(bytes("\nendobj\n")); };

  push(bytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  const total = 2 + pages.length * 3;
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((p, i) => {
    const pageN = 3 + i * 3, contentN = pageN + 1, imgN = pageN + 2;
    obj(pageN, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] /Resources << /XObject << /Im0 ${imgN} 0 R >> >> /Contents ${contentN} 0 R >>`);
    const content = `q ${A4_W} 0 0 ${A4_H} 0 0 cm /Im0 Do Q`;
    obj(contentN, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const head = bytes(`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.data.length} >>\nstream\n`);
    const full = new Uint8Array(head.length + p.data.length + 10);
    full.set(head, 0); full.set(p.data, head.length); full.set(bytes("\nendstream"), head.length + p.data.length);
    obj(imgN, full);
  });

  const xrefAt = pos;
  let xref = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= total; n++) xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  push(bytes(xref));
  push(bytes(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`));

  const out = new Uint8Array(pos);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

export function dataUrlToBytes(dataUrl) {
  const bin = atob(dataUrl.split(",")[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
