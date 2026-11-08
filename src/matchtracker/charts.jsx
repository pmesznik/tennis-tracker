// Tennis Tracker — proste wykresy SVG/CSS do statystyk (bez bibliotek).
// Strona A zawsze w kolorze akcentu, strona B w drugim kolorze motywu.
import { useThemeCtx } from "../theme.js";
import { flowSeries } from "./stats.js";
import { sampleIndexes } from "./timeline.js";

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

// Punkty obu zawodników narastająco w czasie meczu, ze znacznikami końców setów.
export function PointsChart({ timeline, nameA, nameB, setLabel = (n) => `Set ${n}` }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  if (!timeline || timeline.a.length < 3) return null;
  const { a, b, setEnds } = timeline;
  const n = a.length - 1;
  const W = 300, H = 130, pl = 24, pr = 6, pt = 6, pb = 20;
  const max = Math.max(3, a[n], b[n]);
  const idx = sampleIndexes(n, 160);
  const x = (i) => pl + (i / n) * (W - pl - pr);
  const y = (v) => H - pb - (v / max) * (H - pt - pb);
  const pts = (arr) => idx.map((i) => `${x(i).toFixed(1)},${y(arr[i]).toFixed(1)}`).join(" ");
  const bounds = [0, ...setEnds, ...(setEnds[setEnds.length - 1] === n ? [] : [n])];
  return (
    <div style={{ padding: "6px 14px 12px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${nameA}: ${a[n]}, ${nameB}: ${b[n]}`}>
        {[0, 0.5, 1].map((f) => {
          const v = Math.round(max * f);
          return (
            <g key={f}>
              <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke={t.border} strokeWidth="1" />
              <text x={pl - 4} y={y(v) + 4} textAnchor="end" fontSize="11" fill={t.textMuted}>{v}</text>
            </g>
          );
        })}
        {bounds.slice(0, -1).map((s, k) => (
          <g key={k}>
            {k > 0 && <line x1={x(s)} x2={x(s)} y1={pt} y2={H - pb} stroke={t.textMuted} strokeWidth="1" strokeDasharray="3 3" />}
            <text x={(x(s) + x(bounds[k + 1])) / 2} y={H - 5} textAnchor="middle" fontSize="11" fill={t.textMuted}>{setLabel(k + 1)}</text>
          </g>
        ))}
        <polyline points={pts(b)} fill="none" stroke={c.b} strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round" />
        <polyline points={pts(a)} fill="none" stroke={c.a} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(n)} cy={y(a[n])} r="4" fill={c.a} stroke={t.bg} strokeWidth="2" />
        <circle cx={x(n)} cy={y(b[n])} r="4" fill={c.b} stroke={t.bg} strokeWidth="2" />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: t.textSub, marginTop: 4 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: c.a, marginRight: 5 }} />{nameA}: <strong style={{ color: t.text }}>{a[n]}</strong></span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: c.b, marginRight: 5 }} />{nameB}: <strong style={{ color: t.text }}>{b[n]}</strong></span>
      </div>
    </div>
  );
}

// Gemy po kolei: w każdym secie rząd kwadracików w kolorze strony, która wygrała gem.
export function GamesStrip({ timeline, setLabel = (n) => `Set ${n}` }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  if (!timeline || !timeline.games.length) return null;
  return (
    <div style={{ padding: "4px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      {timeline.games.map((row, si) => (
        <div key={si} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 52, fontSize: 12, color: t.textMuted, flexShrink: 0 }}>{setLabel(si + 1)}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {row.map((w, gi) => (
              <span key={gi} aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 4, background: w === "team1" ? c.a : c.b }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Punkty wygrane przez każdą stronę w kolejnych setach (pasek proporcji + liczby).
export function SetPointsBars({ timeline, setLabel = (n) => `Set ${n}` }) {
  const { t } = useThemeCtx();
  const c = sideColors(t);
  if (!timeline) return null;
  const n = timeline.a.length - 1;
  const bounds = [0, ...timeline.setEnds, ...(timeline.setEnds[timeline.setEnds.length - 1] === n ? [] : [n])];
  return (
    <div style={{ padding: "4px 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
      {bounds.slice(0, -1).map((s, k) => {
        const e = bounds[k + 1];
        const pa = timeline.a[e] - timeline.a[s], pb = timeline.b[e] - timeline.b[s];
        const sum = pa + pb || 1;
        return (
          <div key={k}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <strong style={{ color: c.a }}>{pa}</strong>
              <span style={{ fontSize: 12, color: t.textMuted }}>{setLabel(k + 1)}</span>
              <strong style={{ color: t.text }}>{pb}</strong>
            </div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }} aria-hidden="true">
              <div style={{ width: `${(pa / sum) * 100}%`, background: c.a }} />
              <div style={{ width: `${(pb / sum) * 100}%`, background: c.b }} />
            </div>
          </div>
        );
      })}
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
