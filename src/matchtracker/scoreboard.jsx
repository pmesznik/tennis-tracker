// Tennis Tracker — style tablicy wyniku gema: Klapki (domyślny), Tarcza, Piłka,
// Pierścień. Wszystkie dostają te same dane (etykiety punktów, kto
// serwuje, czy to tie-break, czy właśnie skończył się gem) — liczenie punktów
// zostaje w scoringEngine.js, tu jest tylko wyświetlanie. W tie-breaku (i super
// tie-breaku) tarcza ma skalę 0/3/6/9 i obraca się o 30° na punkt, a pierścień
// dzieli się na tyle segmentów, do ilu punktów gra się tie-break; segmenty i
// matryca zmniejszają cyfry do trzech znaków.
import { useRef } from "react";
import { useThemeCtx } from "../theme.js";
import { ScoreTile, TennisBall } from "./ui.jsx";

export const SCORE_STYLES = ["klapki", "tarcza", "pilka", "pierscien", "neon", "kreda", "segment", "matryca"];
const KEY = "atz_score_style";

export function getStoredScoreStyle() {
  try {
    const v = localStorage.getItem(KEY);
    return SCORE_STYLES.includes(v) ? v : "klapki";
  } catch {
    return "klapki";
  }
}
export function setStoredScoreStyle(s) {
  try {
    localStorage.setItem(KEY, s);
  } catch {}
}

const DIAL_ANGLE = { "0": 0, "15": 90, "30": 180, "40": 270, Ad: 315 };
const RING_FILL = { "0": 0, "15": 1, "30": 2, "40": 3, Ad: 4 };

// Skala: pełne kafelki są zmniejszone tak, żeby dwie tablice mieściły się w
// 360 px i zostawiały miejsce na duże przyciski punktów; podgląd w menu jest
// jeszcze mniejszy. `zoom` działa w Chromium/WebView Androida.
const FULL = { tarcza: 0.68, pilka: 0.78, pierscien: 0.8, neon: 0.72, kreda: 0.72, segment: 0.68, matryca: 0.72 };
const MINI = { tarcza: 0.3, pilka: 0.36, pierscien: 0.38, neon: 0.32, kreda: 0.32, segment: 0.3, matryca: 0.34 };

function Dial({ label, forward, k, tiebreak }) {
  const { t } = useThemeCtx();
  const r = useRef({ rot: 0, label: "0", tb: false });
  if (r.current.label !== label || r.current.tb !== tiebreak) {
    // Gem: 0/15/30/40/Ad na stałych kątach. Tie-break: 30° na punkt, więc
    // dowolny wynik ma swoje miejsce na tarczy (12 punktów = pełny obrót).
    const target = tiebreak ? (parseInt(label, 10) || 0) * 30 : DIAL_ANGLE[label] ?? 0;
    let d = ((target - r.current.rot) % 360 + 360) % 360;
    if ((!forward || tiebreak) && d > 180) d -= 360; // najkrótsza droga, poza końcem gema
    r.current.rot += d;
    r.current.label = label;
    r.current.tb = tiebreak;
  }
  const marks = tiebreak ? ["0", "3", "6", "9"] : ["0", "15", "30", "40"];
  const font = t.fontScore;
  return (
    <div style={{ zoom: k, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r="78" fill="#2b241e" />
          <circle cx="80" cy="80" r="71" fill="#fbf6ea" />
          <circle cx="80" cy="80" r="64" fill="none" stroke="#a88132" strokeWidth="1" />
          <g stroke="#2b241e" strokeLinecap="round">
            <line x1="80" y1="16" x2="80" y2="27" strokeWidth="3" />
            <line x1="144" y1="80" x2="133" y2="80" strokeWidth="3" />
            <line x1="80" y1="144" x2="80" y2="133" strokeWidth="3" />
            <line x1="16" y1="80" x2="27" y2="80" strokeWidth="3" />
            <line x1="112" y1="24.57" x2="109" y2="29.77" strokeWidth="1.5" />
            <line x1="135.43" y1="48" x2="130.23" y2="51" strokeWidth="1.5" />
            <line x1="135.43" y1="112" x2="130.23" y2="109" strokeWidth="1.5" />
            <line x1="112" y1="135.43" x2="109" y2="130.23" strokeWidth="1.5" />
            <line x1="48" y1="135.43" x2="51" y2="130.23" strokeWidth="1.5" />
            <line x1="24.57" y1="112" x2="29.77" y2="109" strokeWidth="1.5" />
            <line x1="24.57" y1="48" x2="29.77" y2="51" strokeWidth="1.5" />
            <line x1="48" y1="24.57" x2="51" y2="29.77" strokeWidth="1.5" />
          </g>
          <circle cx="36.9" cy="36.9" r="3" fill="#a88132" />
          <g fontFamily={font} fontSize="17" fontWeight="700" fill="#2b241e" textAnchor="middle" dominantBaseline="central">
            <text x="80" y="40">{marks[0]}</text><text x="120" y="80">{marks[1]}</text>
            <text x="80" y="120">{marks[2]}</text><text x="40" y="80">{marks[3]}</text>
            {!tiebreak && <text x="53" y="53" fontSize="13" fill="#8a6a28">Ad</text>}
          </g>
        </svg>
        <div style={{
          position: "absolute", left: 78, top: 26, width: 4, height: 68, borderRadius: 2, background: t.accent,
          transformOrigin: "2px 54px", transform: `rotate(${r.current.rot}deg)`,
          transition: "transform .7s cubic-bezier(.3,1.35,.5,1)",
        }} />
        <div style={{
          position: "absolute", left: 72, top: 72, width: 16, height: 16, boxSizing: "border-box",
          borderRadius: "50%", background: t.accent2, border: "3px solid #2b241e",
        }} />
      </div>
      <span style={{ fontFamily: font, fontWeight: 800, fontSize: 40, lineHeight: 1, color: t.text }}>{label}</span>
    </div>
  );
}

function Ball({ label, k }) {
  const { t } = useThemeCtx();
  return (
    <div key={label} style={{
      zoom: k, position: "relative", width: 128, height: 128, borderRadius: "50%",
      background: "radial-gradient(circle at 34% 30%, #effa86 0%, #d2e53c 45%, #a6ba20 100%)",
      boxShadow: "0 12px 24px rgba(0,0,0,.45), inset 0 -8px 14px rgba(0,0,0,.18)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "sbSpin .6s cubic-bezier(.2,.7,.3,1)",
    }}>
      <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        <path d="M16 30 C 50 48, 50 80, 16 98" stroke="#fbfde8" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M112 30 C 78 48, 78 80, 112 98" stroke="#fbfde8" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
      <span style={{ position: "relative", fontFamily: t.fontScore, fontWeight: 800, fontSize: label.length > 2 ? 46 : 62, lineHeight: 1, color: "#2c3510" }}>{label}</span>
    </div>
  );
}

// Łuk n-tego z N segmentów pierścienia (r 52, środek 64, przerwa 10° / N-zależna).
function arcPath(i, N) {
  const gap = N > 6 ? 8 : 10;
  const a0 = ((-90 + (i * 360) / N + gap / 2) * Math.PI) / 180;
  const a1 = ((-90 + ((i + 1) * 360) / N - gap / 2) * Math.PI) / 180;
  const pt = (a) => `${(64 + 52 * Math.cos(a)).toFixed(2)} ${(64 + 52 * Math.sin(a)).toFixed(2)}`;
  return `M${pt(a0)} A 52 52 0 0 1 ${pt(a1)}`;
}

function Ring({ label, k, tiebreak, target }) {
  const { t } = useThemeCtx();
  // Gem: 4 segmenty (0/15/30/40/Ad). Tie-break: tyle segmentów, do ilu punktów
  // się gra (7 albo 10), po przekroczeniu celu pierścień zostaje pełny.
  const N = tiebreak ? Math.max(2, target || 7) : 4;
  const n = tiebreak ? Math.min(parseInt(label, 10) || 0, N) : RING_FILL[label] ?? 0;
  const over = tiebreak && (parseInt(label, 10) || 0) >= N;
  return (
    <div style={{
      zoom: k, position: "relative", width: 132, height: 132, borderRadius: "50%",
      background: "rgba(0,0,0,.38)", boxShadow: "0 12px 24px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="132" height="132" viewBox="0 0 128 128" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: N }, (_, i) => (
          <path key={i} d={arcPath(i, N)} fill="none" strokeWidth={N > 6 ? 8 : 10} strokeLinecap="round"
            stroke={i < n ? (over ? t.accent2 : t.accent) : "rgba(255,255,255,.14)"} style={{ transition: "stroke .35s ease" }} />
        ))}
      </svg>
      <span key={label} style={{
        position: "relative", fontFamily: t.fontScore, fontWeight: 800, fontSize: label.length > 2 ? 38 : 50, lineHeight: 1,
        color: label === "Ad" ? t.accent : t.text, animation: "sbPop .4s cubic-bezier(.2,.8,.3,1)",
      }}>{label}</span>
    </div>
  );
}

const POINT_COUNT = { "0": 0, "15": 1, "30": 2, "40": 3, Ad: 4 };

function Neon({ label, k }) {
  const { t } = useThemeCtx();
  const c = t.accent;
  return (
    <div style={{
      zoom: k, width: 136, height: 136, borderRadius: 24, background: "#140e10",
      boxShadow: "0 12px 24px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.05)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span key={label} style={{
        width: 106, height: 106, boxSizing: "border-box", borderRadius: "50%", border: `3px solid ${c}`,
        boxShadow: `0 0 8px ${c}, 0 0 22px ${c}88, inset 0 0 8px ${c}, inset 0 0 18px ${c}55`,
        display: "flex", alignItems: "center", justifyContent: "center", animation: "sbFlicker .7s steps(1, end)",
      }}>
        <span style={{
          fontFamily: t.fontScore, fontWeight: 800, fontSize: label.length > 2 ? 42 : 56, lineHeight: 1, color: "#fdfff4",
          textShadow: `0 0 4px ${c}, 0 0 12px ${c}, 0 0 26px ${c}aa`,
        }}>{label}</span>
      </span>
    </div>
  );
}

function Chalk({ label, k, index, tiebreak }) {
  const { t } = useThemeCtx();
  const n = tiebreak ? 0 : (POINT_COUNT[label] ?? 0);
  const tilt = ["8deg", "-4deg", "6deg", "-6deg"];
  return (
    <div style={{
      zoom: k, width: 148, height: 132, boxSizing: "border-box", border: "8px solid #8a5a34", borderRadius: 8,
      backgroundColor: "#233229", backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1.4px)", backgroundSize: "5px 5px",
      boxShadow: "0 12px 24px rgba(0,0,0,.45), inset 0 0 18px rgba(0,0,0,.5)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
    }}>
      <span key={label} style={{
        display: "inline-block", fontFamily: t.fontScore, fontWeight: 700, fontSize: label.length > 2 ? 52 : 68, lineHeight: 1, color: "#f2f0e6",
        textShadow: "0 0 2px rgba(242,240,230,.6), 1px 1px 0 rgba(242,240,230,.15)",
        transform: `rotate(${index === 0 ? -3 : 2}deg)`, animation: "sbWrite .45s ease-out",
      }}>{label}</span>
      <span aria-hidden="true" style={{ display: "flex", gap: 6, height: 16, alignItems: "center" }}>
        {tilt.map((r, i) => (
          <i key={i} style={{
            display: "block", width: 3, height: 15, borderRadius: 2, background: i === 3 ? "#e8c547" : "#f2f0e6",
            opacity: i < n ? 1 : 0, transition: "opacity .3s", transform: `rotate(${r})`,
          }} />
        ))}
      </span>
    </div>
  );
}

const SEG_POLYS = [
  "9,1 41,1 45,5 41,9 9,9 5,5",
  "41,10 45,6 49,10 49,39 45,43 41,39",
  "41,51 45,47 49,51 49,80 45,84 41,80",
  "9,81 41,81 45,85 41,89 9,89 5,85",
  "1,51 5,47 9,51 9,80 5,84 1,80",
  "1,10 5,6 9,10 9,39 5,43 1,39",
  "9,41 41,41 45,45 41,49 9,49 5,45",
];
const SEG_MAP = {
  "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg",
  "7": "abc", "8": "abcdefg", "9": "abcdfg", A: "abcefg", d: "bcdeg",
};

function SegDigit({ ch, hidden, color }) {
  const lit = SEG_MAP[ch] || "";
  return (
    <svg width="46" height="83" viewBox="0 0 50 90" aria-hidden="true" style={{ display: hidden ? "none" : "block" }}>
      {SEG_POLYS.map((pts, i) => (
        <polygon key={i} points={pts} style={{ fill: lit.includes("abcdefg"[i]) ? color : "rgba(255,255,255,.06)", transition: "fill .18s ease" }} />
      ))}
    </svg>
  );
}

function Segment({ label, k }) {
  const { t } = useThemeCtx();
  const chars = label.length === 1 ? ["", label] : label.split("");
  const squeeze = chars.length > 2 ? 0.78 : 1;
  return (
    <div style={{
      zoom: k, width: 136, height: 156, boxSizing: "border-box", border: "1px solid #2a2a2e", borderRadius: 16,
      background: "#0f0f11", boxShadow: "0 14px 28px rgba(0,0,0,.5), inset 0 0 24px rgba(0,0,0,.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span key={label} style={{
        display: "flex", gap: 10, transform: "skewX(-6deg)", filter: `drop-shadow(0 0 6px ${t.accent}99)`,
        animation: "sbHit .4s ease-out", zoom: squeeze,
      }}>
        {chars.map((ch, i) => <SegDigit key={i} ch={ch} hidden={!ch} color={t.accent} />)}
      </span>
    </div>
  );
}

const DOT_FONT = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  d: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
};
// Siatka 7 wierszy; 1-2 znaki w 11 kolumnach (duże diody), 3 znaki w 17
// kolumnach (mniejsze diody), każdy znak 5 kolumn + kolumna przerwy.
function dotBits(label) {
  const cols = label.length > 2 ? 17 : 11;
  const start = label.length === 1 ? 3 : 0;
  const bits = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < cols; c++) {
      let b = "0";
      const idx = Math.floor((c - start) / 6);
      const off = (c - start) - idx * 6;
      if (c >= start && off < 5 && idx >= 0 && idx < label.length) b = DOT_FONT[label[idx]]?.[r][off] ?? "0";
      bits.push(b === "1");
    }
  }
  return { bits, cols };
}

function Matrix({ label, k }) {
  const { t } = useThemeCtx();
  const { bits, cols } = dotBits(label);
  const small = cols > 11;
  const d = small ? 5 : 8;
  return (
    <div style={{
      zoom: k, width: 150, height: 128, boxSizing: "border-box", border: "1px solid #2b2420", borderRadius: 16,
      background: "#0e0b0a", boxShadow: "0 14px 28px rgba(0,0,0,.5), inset 0 0 20px rgba(0,0,0,.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span key={label} aria-hidden="true" style={{
        display: "grid", gridTemplateColumns: `repeat(${cols}, ${d}px)`, gap: small ? 2 : 3, animation: "sbScan .35s steps(7, end)",
      }}>
        {bits.map((on, i) => (
          <i key={i} style={{
            display: "block", width: d, height: d, borderRadius: "50%",
            background: on ? t.accent : "#2a201b", boxShadow: on ? `0 0 ${small ? 3 : 5}px ${t.accent}aa` : "none",
            transition: "background-color .2s ease, box-shadow .2s ease",
          }} />
        ))}
      </span>
    </div>
  );
}

function ServeBall({ side }) {
  return (
    <span style={{
      position: "absolute", top: "50%", zIndex: 3, pointerEvents: "none",
      animation: "ballBounce 0.9s ease-in-out infinite", ...(side === "left" ? { left: -26 } : { right: -26 }),
    }}><TennisBall size={22} /></span>
  );
}

// style: klucz stylu; labels: ["15","30"]; server: "team1" | "team2" | null;
// tiebreak: true w tie-breaku/super tie-breaku; gameEnded: true tuż po wygranym
// gemie (tarcza kręci się wtedy do przodu); compact: miniatura do menu.
export default function ScoreBoard({ style, labels, server, tiebreak = false, tbTarget = 7, gameEnded = false, compact = false }) {
  const { t } = useThemeCtx();
  const eff = style;
  const scale = (compact ? MINI : FULL)[eff];
  const cell = (i, side) => {
    const label = labels[i];
    let body;
    if (eff === "klapki") body = <ScoreTile key={label} value={label} size={compact ? "sm" : "lg"} />;
    else if (eff === "tarcza") body = <Dial label={label} forward={gameEnded} k={scale} tiebreak={tiebreak} />;
    else if (eff === "pilka") body = <Ball label={label} k={scale} />;
    else if (eff === "neon") body = <Neon label={label} k={scale} />;
    else if (eff === "kreda") body = <Chalk label={label} k={scale} index={i} tiebreak={tiebreak} />;
    else if (eff === "segment") body = <Segment label={label} k={scale} />;
    else if (eff === "matryca") body = <Matrix label={label} k={scale} />;
    else body = <Ring label={label} k={scale} tiebreak={tiebreak} target={tbTarget} />;
    const serving = !compact && server === (i === 0 ? "team1" : "team2");
    return (
      <div style={{ position: "relative", display: "flex" }}>
        {serving && <ServeBall side={side} />}
        {body}
      </div>
    );
  };
  const sep = eff === "klapki"
    ? <span style={{ fontSize: compact ? 14 : 22, fontWeight: 800, color: t.textMuted }}>:</span>
    : (
      <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: compact ? 4 : 9 }}>
        {[0, 1].map((i) => <i key={i} style={{ display: "block", width: compact ? 4 : 7, height: compact ? 4 : 7, borderRadius: "50%", background: t.textSub, opacity: 0.7 }} />)}
      </span>
    );
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: compact ? 6 : 14 }}>
      {cell(0, "left")}
      {sep}
      {cell(1, "right")}
    </div>
  );
}
