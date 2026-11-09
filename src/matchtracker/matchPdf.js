// Tennis Tracker — PDF z podsumowaniem meczu. Strony A4 (jasne, do druku) są
// rysowane na canvasie i składane w PDF przez pdfWriter.js; w aplikacji na
// Androidzie plik trafia do cache i jest udostępniany systemowym arkuszem.
import { buildPdf, dataUrlToBytes, bytesToBase64 } from "./pdfWriter.js";
import { sampleIndexes } from "./timeline.js";
import { isNativePlatform } from "./shareLink.js";

const PW = 1240, PH = 1754, M = 80;
const FONT = "Roboto, system-ui, Arial, sans-serif";
const C = { a: "#2a78d6", b: "#eb6834", ink: "#1a1a19", sub: "#52514e", muted: "#898781", grid: "#e1e0d9", line: "#c3c2b7" };

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const font = (w, px) => `${w} ${px}px ${FONT}`;

/**
 * @param {object} d {
 *   L: etykiety, nameA, nameB, headline (data · nawierzchnia · czas), sets:[{a,b,tiebreak,isSuperTiebreak,partial}],
 *   note, timeline, rows:[{label,a,b}], extra, logoUrl, lang }
 * @returns {Promise<HTMLCanvasElement[]>}
 */
export async function renderMatchPages(d) {
  const logo = await loadImage(d.logoUrl);
  const L = d.L;
  const pages = [];
  let c, ctx, y;

  const addPage = () => {
    c = document.createElement("canvas"); c.width = PW; c.height = PH;
    ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PW, PH);
    ctx.textBaseline = "alphabetic";
    pages.push(c); y = M;
  };
  const need = (h) => { if (y + h > PH - M - 50) addPage(); };
  const text = (s, x, yy, f, color, align = "left", maxW) => {
    ctx.font = f; ctx.fillStyle = color; ctx.textAlign = align;
    if (maxW) ctx.fillText(String(s), x, yy, maxW); else ctx.fillText(String(s), x, yy);
  };
  const hline = (yy, color = C.line, w = 2) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(M, yy); ctx.lineTo(PW - M, yy); ctx.stroke(); };
  const square = (x, yy, s, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, yy, s, s, 5) : ctx.rect(x, yy, s, s); ctx.fill(); };

  addPage();
  // Nagłówek z logo
  let tx = M;
  if (logo) { ctx.drawImage(logo, M, y - 6, 68, 68); tx = M + 84; }
  text("Tennis Tracker", tx, y + 44, font(500, 42), C.ink);
  text(d.headline, PW - M, y + 44, font(400, 26), C.sub, "right", 620);
  y += 84;
  hline(y, C.a, 5); y += 56;

  // Tytuł i wynik
  text(L.title, PW / 2, y, font(400, 28), C.sub, "center"); y += 58;
  const vs = ` ${L.vs} `;
  ctx.font = font(500, 50);
  const wA = ctx.measureText(d.nameA).width, wV = ctx.measureText(vs).width, wB = ctx.measureText(d.nameB).width;
  const avail = PW - 2 * M, k = Math.min(1, avail / (wA + wV + wB));
  const fs = Math.floor(50 * k);
  ctx.font = font(500, fs);
  const a2 = ctx.measureText(d.nameA).width, v2 = ctx.measureText(vs).width, b2 = ctx.measureText(d.nameB).width;
  let sx = (PW - (a2 + v2 + b2)) / 2;
  text(d.nameA, sx, y, font(500, fs), C.ink); sx += a2;
  text(vs, sx, y, font(400, fs), C.sub); sx += v2;
  text(d.nameB, sx, y, font(500, fs), C.ink);
  y += 64;

  // Tabela wyniku w setach
  const nameCol = 470, setW = Math.min(150, (PW - 2 * M - nameCol) / Math.max(1, d.sets.length));
  if (d.sets.length) {
    d.sets.forEach((s, i) => text(L.setN.replace("{n}", i + 1), M + nameCol + setW * i + setW / 2, y, font(400, 24), C.sub, "center"));
    y += 16;
  }
  [["a", d.nameA, C.a], ["b", d.nameB, C.b]].forEach(([side, name, color]) => {
    y += 56;
    square(M, y - 28, 26, color);
    text(name, M + 40, y - 4, font(side === d.winner ? 500 : 400, 36), C.ink, "left", nameCol - 50);
    d.sets.forEach((s, i) => {
      const x = M + nameCol + setW * i + setW / 2;
      const mine = s[side], other = s[side === "a" ? "b" : "a"];
      const won = mine > other && !s.partial;
      text(s.isSuperTiebreak ? `[${mine}]` : mine, x, y - 4, font(won ? 500 : 400, 40), s.partial ? C.muted : C.ink, "center");
      if (s.tiebreak && mine < other) text(`(${Math.min(s.tiebreak.a, s.tiebreak.b)})`, x + 38, y - 18, font(400, 22), C.sub, "left");
    });
  });
  y += 30;
  if (d.note) { text(d.note, PW / 2, y + 20, font(400, 28), C.sub, "center"); y += 50; }
  y += 24;

  // Wykres: punkty narastająco
  const tl = d.timeline;
  if (tl) {
    need(520);
    text(L.pointsTitle, M, y, font(500, 34), C.ink); y += 34;
    text(L.pointsHint, M, y, font(400, 24), C.sub); y += 20;
    drawPointsChart(ctx, tl, M, y, PW - 2 * M, 310, L);
    y += 352;
    // Legenda
    square(M, y - 20, 22, C.a); text(`${d.nameA}: ${tl.a[tl.a.length - 1]}`, M + 34, y - 2, font(400, 26), C.sub);
    const lx = M + 34 + ctx.measureText(`${d.nameA}: ${tl.a[tl.a.length - 1]}`).width + 40;
    square(lx, y - 20, 22, C.b); text(`${d.nameB}: ${tl.b[tl.b.length - 1]}`, lx + 34, y - 2, font(400, 26), C.sub);
    y += 50;

    // Wykres: przebieg (różnica punktów)
    need(300);
    text(L.flowTitle, M, y, font(500, 34), C.ink); y += 34;
    text(L.flowHint, M, y, font(400, 24), C.sub); y += 20;
    drawFlowChart(ctx, tl, M, y, PW - 2 * M, 170);
    y += 200;

    // Gemy po kolei
    need(60 + tl.games.length * 40);
    text(L.gamesTitle, M, y, font(500, 34), C.ink); y += 14;
    tl.games.forEach((row, si) => {
      y += 40;
      text(L.setN.replace("{n}", si + 1), M, y - 8, font(400, 26), C.sub);
      row.forEach((w, gi) => square(M + 130 + gi * 40, y - 30, 30, w === "team1" ? C.a : C.b));
    });
    y += 40;
  }

  // Statystyki
  if (d.rows.length) {
    need(90 + d.rows.length * 50);
    const colA = PW - M - 330, colB = PW - M - 110;
    square(colA - 70, y - 24, 22, C.a); text(d.shortA, colA - 40, y - 4, font(400, 26), C.sub, "left", 140);
    square(colB - 70, y - 24, 22, C.b); text(d.shortB, colB - 40, y - 4, font(400, 26), C.sub, "left", 140);
    y += 16;
    hline(y);
    d.rows.forEach((r) => {
      y += 50;
      text(r.label, M, y - 14, font(500, 30), C.ink, "left", colA - M - 90);
      text(r.a, colA + 30, y - 14, font(400, 32), C.ink, "center");
      text(r.b, colB + 30, y - 14, font(400, 32), C.ink, "center");
      hline(y, C.grid, 1.5);
    });
    y += 18;
  }
  [].concat(d.extra || []).forEach((line) => { need(50); y += 40; text(line, M, y, font(400, 28), C.sub, "left", PW - 2 * M); });

  // Stopki
  pages.forEach((p, i) => {
    const g = p.getContext("2d");
    g.font = font(400, 24); g.fillStyle = C.muted; g.textAlign = "center";
    g.fillText(`${L.footer} · ${L.pageOf.replace("{n}", i + 1).replace("{m}", pages.length)}`, PW / 2, PH - 50);
  });
  return pages;
}

function axisY(ctx, x, y, w, h, max, pad) {
  [0, 0.5, 1].forEach((f) => {
    const v = Math.round(max * f), yy = y + h - pad - (v / max) * (h - pad - 10);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 60, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    ctx.font = font(400, 22); ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.fillText(String(v), x + 50, yy + 8);
  });
}

function drawPointsChart(ctx, tl, x, y, w, h, L) {
  const n = tl.a.length - 1, max = Math.max(3, tl.a[n], tl.b[n]);
  const pad = 36, left = x + 64, right = x + w - 10;
  const px = (i) => left + (i / n) * (right - left);
  const py = (v) => y + h - pad - (v / max) * (h - pad - 10);
  axisY(ctx, x, y, w, h, max, pad);
  const idx = sampleIndexes(n, 260);
  let prev = 0;
  tl.setEnds.forEach((e, k) => {
    if (k < tl.setEnds.length - 1) {
      ctx.setLineDash([8, 8]); ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px(e), y + 10); ctx.lineTo(px(e), y + h - pad); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.font = font(400, 22); ctx.fillStyle = C.muted; ctx.textAlign = "center";
    ctx.fillText(L.setN.replace("{n}", k + 1), (px(prev) + px(e)) / 2, y + h - 8);
    prev = e;
  });
  if (prev < n) { ctx.font = font(400, 22); ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.fillText(L.setN.replace("{n}", tl.setEnds.length + 1), (px(prev) + px(n)) / 2, y + h - 8); }
  const line = (arr, color, dash) => {
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.setLineDash(dash);
    ctx.beginPath(); idx.forEach((i, j) => (j ? ctx.lineTo(px(i), py(arr[i])) : ctx.moveTo(px(i), py(arr[i])))); ctx.stroke(); ctx.setLineDash([]);
  };
  line(tl.b, C.b, [14, 8]);
  line(tl.a, C.a, []);
  [[tl.a, C.a], [tl.b, C.b]].forEach(([arr, color]) => {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(px(n), py(arr[n]), 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px(n), py(arr[n]), 7, 0, Math.PI * 2); ctx.fill();
  });
}

function drawFlowChart(ctx, tl, x, y, w, h) {
  const n = tl.a.length - 1;
  const diff = tl.a.map((v, i) => v - tl.b[i]);
  const m = Math.max(3, ...diff.map(Math.abs));
  const left = x + 64, right = x + w - 10, mid = y + h / 2;
  const px = (i) => left + (i / n) * (right - left);
  const py = (v) => mid - (v / m) * (h / 2 - 10);
  const idx = sampleIndexes(n, 260);
  const poly = () => { ctx.beginPath(); ctx.moveTo(px(0), mid); idx.forEach((i) => ctx.lineTo(px(i), py(diff[i]))); ctx.lineTo(px(n), mid); ctx.closePath(); };
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h / 2); ctx.clip(); poly(); ctx.fillStyle = `${C.a}38`; ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(x, mid, w, h / 2); ctx.clip(); poly(); ctx.fillStyle = `${C.b}38`; ctx.fill(); ctx.restore();
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(right, mid); ctx.stroke();
  tl.setEnds.forEach((e, k) => {
    if (k < tl.setEnds.length - 1) {
      ctx.setLineDash([8, 8]); ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px(e), y + 6); ctx.lineTo(px(e), y + h - 6); ctx.stroke(); ctx.setLineDash([]);
    }
  });
  ctx.strokeStyle = C.sub; ctx.lineWidth = 3; ctx.lineJoin = "round";
  ctx.beginPath(); idx.forEach((i, j) => (j ? ctx.lineTo(px(i), py(diff[i])) : ctx.moveTo(px(i), py(diff[i])))); ctx.stroke();
  ctx.font = font(400, 22); ctx.textAlign = "right";
  ctx.fillStyle = C.a; ctx.fillText(`+${m}`, x + 52, y + 24);
  ctx.fillStyle = C.b; ctx.fillText(`-${m}`, x + 52, y + h - 6);
}

export async function renderMatchPdf(d) {
  const pages = await renderMatchPages(d);
  const jpegs = pages.map((c) => ({ data: dataUrlToBytes(c.toDataURL("image/jpeg", 0.92)), width: c.width, height: c.height }));
  return buildPdf(jpegs);
}

// Udostępnia PDF. Zwraca "shared" | "downloaded" | "failed".
export async function shareMatchPdf(pdfBytes, fileName, text) {
  try {
    if (isNativePlatform()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      await Filesystem.writeFile({ path: fileName, data: bytesToBase64(pdfBytes), directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({ title: text, text, files: [uri] });
      return "shared";
    }
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return "shared";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
