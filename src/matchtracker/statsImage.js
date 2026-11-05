// Tennis Tracker — statystyki jako obraz PNG do wysłania (komunikator, mail).
// Rysowane na canvasie w kolorach aktualnego motywu; w aplikacji na Androidzie
// plik trafia do cache i jest udostępniany systemowym arkuszem, w przeglądarce
// używamy Web Share z plikiem albo pobrania.
import { isNativePlatform } from "./shareLink.js";

const W = 1080;
const FONT = "Roboto, system-ui, sans-serif";
const NUM = "'Barlow Condensed', Roboto, system-ui, sans-serif";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * @param {object} d { title, nameA, nameB, scoreA, scoreB, subtitle, rows:[{label,a,b,aText,bText}], footer }
 * @param {object} t motyw (kolory)
 * @returns {string} data URL PNG
 */
export function renderStatsPng(d, t) {
  const rowH = 96, top = 400;
  const H = top + d.rows.length * rowH + 150;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const colA = t.accent, colB = "#B8BCC8";

  ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, `${t.accent}33`); g.addColorStop(0.6, "transparent");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.textSub; ctx.font = `600 34px ${FONT}`; ctx.textAlign = "center";
  ctx.fillText(d.title.toUpperCase(), W / 2, 80);

  ctx.font = `700 52px ${FONT}`;
  ctx.fillStyle = colA; ctx.textAlign = "left"; ctx.fillText(d.nameA, 60, 170, 440);
  ctx.fillStyle = colB; ctx.textAlign = "right"; ctx.fillText(d.nameB, W - 60, 170, 440);

  ctx.textAlign = "center"; ctx.font = `700 150px ${NUM}`;
  ctx.fillStyle = colA; ctx.fillText(String(d.scoreA), W / 2 - 90, 320);
  ctx.fillStyle = t.text; ctx.fillText(":", W / 2, 312);
  ctx.fillStyle = colB; ctx.fillText(String(d.scoreB), W / 2 + 90, 320);
  if (d.subtitle) { ctx.font = `400 30px ${FONT}`; ctx.fillStyle = t.textSub; ctx.fillText(d.subtitle, W / 2, 360 - 4); }

  d.rows.forEach((r, i) => {
    const y = top + 30 + i * rowH;
    ctx.fillStyle = t.surface || "rgba(255,255,255,0.05)";
    roundRect(ctx, 40, y - 24, W - 80, rowH - 12, 24); ctx.fill();
    const sum = (r.a || 0) + (r.b || 0);
    const lead = r.a === r.b ? 0 : (r.a > r.b) === (r.higherIsBetter !== false) ? -1 : 1;
    ctx.font = `700 44px ${NUM}`; ctx.textAlign = "left";
    ctx.fillStyle = lead === -1 ? colA : t.text; ctx.fillText(String(r.aText ?? r.a), 70, y + 24);
    ctx.textAlign = "right";
    ctx.fillStyle = lead === 1 ? colB : t.text; ctx.fillText(String(r.bText ?? r.b), W - 70, y + 24);
    ctx.textAlign = "center"; ctx.font = `500 26px ${FONT}`; ctx.fillStyle = t.textSub;
    ctx.fillText(r.label.toUpperCase(), W / 2, y + 22, 400);
    const bx = 70, bw = W - 140, by = y + 40;
    const pa = sum ? (r.a / sum) : 0.5;
    ctx.globalAlpha = sum ? 1 : 0.25;
    ctx.fillStyle = colA; roundRect(ctx, bx, by, Math.max(0, bw * pa - 3), 10, 5); ctx.fill();
    ctx.fillStyle = colB; roundRect(ctx, bx + bw * pa + 3, by, Math.max(0, bw * (1 - pa) - 3), 10, 5); ctx.fill();
    ctx.globalAlpha = 1;
  });

  ctx.textAlign = "center"; ctx.font = `500 28px ${FONT}`; ctx.fillStyle = t.textMuted;
  ctx.fillText(d.footer || "Tennis Tracker", W / 2, H - 60);
  return c.toDataURL("image/png");
}

// Udostępnia PNG. Zwraca "shared" | "downloaded" | "failed".
export async function shareStatsPng(dataUrl, fileName, text) {
  try {
    if (isNativePlatform()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const base64 = dataUrl.split(",")[1];
      await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({ title: text, text, files: [uri] });
      return "shared";
    }
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return "shared";
    }
    const a = document.createElement("a");
    a.href = dataUrl; a.download = fileName; a.click();
    return "downloaded";
  } catch {
    return "failed";
  }
}
