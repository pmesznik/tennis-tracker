// Tennis Tracker — proste wykresy SVG/CSS do statystyk (bez bibliotek).
// Strona A zawsze w kolorze akcentu, strona B w drugim kolorze motywu.
import { useThemeCtx } from "../theme.js";
import { flowSeries } from "./stats.js";

export function sideColors(t) {
  return { a: t.accent, b: "#B8BCC8" }; // B: neutralny jasnoszary, czytelny na każdej nawierzchni
}

// Wiersz porównania z paskiem proporcji: liczby po bokach, etykieta w środku,
// pod spodem pasek dzielony proporcjonalnie. `a`/`b` to wartości liczbowe do
// pasków, `aText`/`bText` opcjonalny opis (np. "78% (28/36)").
export function StatRow({ label, a, b, aText, bText, higherIsBetter = true }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  const sum = (a || 0) + (b || 0);
  const pa = sum ? ((a || 0) / sum) * 100 : 50;
  const lead = a === b ? 0 : (a > b) === higherIsBetter ? -1 : 1;
  return (
    <div style={{ padding: "8px 14px 9px", borderTop: `1px solid ${t.border}` }}>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ flex: 1, fontWeight: lead === -1 ? 800 : 600, color: lead === -1 ? c.a : t.text, fontFamily: t.fontScore, fontSize: 18 }}>{aText ?? a}</span>
        <span style={{ flex: 1.3, textAlign: "center", fontSize: 11, color: t.textMuted, textTransform: "uppercase", lineHeight: 1.2 }}>{label}</span>
        <span style={{ flex: 1, textAlign: "right", fontWeight: lead === 1 ? 800 : 600, color: lead === 1 ? c.b : t.text, fontFamily: t.fontScore, fontSize: 18 }}>{bText ?? b}</span>
      </div>
      <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", marginTop: 5, gap: 2 }} aria-hidden="true">
        <div style={{ width: `${pa}%`, background: c.a, opacity: sum ? 1 : 0.25 }} />
        <div style={{ width: `${100 - pa}%`, background: c.b, opacity: sum ? 1 : 0.25 }} />
      </div>
    </div>
  );
}

// Kółko z udziałem A (np. wygrane punkty). Środek pokazuje procent A.
export function Donut({ a, b, size = 96, label }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  const sum = (a || 0) + (b || 0);
  const r = 38, circ = 2 * Math.PI * r;
  const fa = sum ? (a / sum) * circ : 0;
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={c.b} strokeWidth="14" opacity={sum ? 1 : 0.25} />
        {sum > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke={c.a} strokeWidth="14" strokeDasharray={`${fa} ${circ - fa}`} transform="rotate(-90 50 50)" />}
        <text x="50" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill={t.text} style={{ fontFamily: t.fontScore }}>
          {sum ? Math.round((a / sum) * 100) : "–"}{sum ? "%" : ""}
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase" }}>{label}</span>}
    </div>
  );
}

export { flowSeries };

export function FlowChart({ series, nameA, nameB, height = 110 }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  if (!series || series.length < 2) return null;
  const W = 300, H = 100, pad = 4;
  const max = Math.max(3, ...series.map((v) => Math.abs(v)));
  const x = (i) => pad + (i / (series.length - 1)) * (W - 2 * pad);
  const y = (v) => H / 2 - (v / max) * (H / 2 - pad);
  const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${x(0)},${H / 2} ${pts} ${x(series.length - 1)},${H / 2}`;
  return (
    <div style={{ padding: "6px 14px 12px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Przebieg meczu">
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke={t.border} strokeWidth="1" />
        <polygon points={area} fill={c.a} opacity="0.18" />
        <polyline points={pts} fill="none" stroke={c.a} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textMuted }}>
        <span style={{ color: c.a }}>▲ {nameA}</span>
        <span>▼ {nameB}</span>
      </div>
    </div>
  );
}

// Ostatnie wyniki zawodnika: kółka W/P (najnowszy z prawej).
export function FormStrip({ results }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  if (!results.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "4px 14px 12px" }}>
      {results.map((r, i) => (
        <span key={i} title={r.title} style={{
          width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800,
          background: r.win === true ? c.a : "transparent", color: r.win === true ? "#0A0A12" : t.textSub,
          border: `2px solid ${r.win === true ? c.a : r.win === false ? t.borderStrong : t.border}`,
        }}>{r.win === true ? "W" : r.win === false ? "P" : "–"}</span>
      ))}
    </div>
  );
}

// Pasek proporcji gemów dla jednego meczu na liście historii.
export function MiniBar({ a, b }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  const sum = a + b;
  if (!sum) return null;
  return (
    <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", gap: 1, width: "100%" }} aria-hidden="true">
      <div style={{ width: `${(a / sum) * 100}%`, background: c.a }} />
      <div style={{ width: `${(b / sum) * 100}%`, background: c.b }} />
    </div>
  );
}
