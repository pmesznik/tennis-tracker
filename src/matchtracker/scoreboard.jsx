// Tennis Tracker — style tablicy wyniku gema: Klapki (domyślny), Tarcza, Piłka,
// Pierścień. Wszystkie dostają te same dane (etykiety punktów, kto
// serwuje, czy to tie-break, czy właśnie skończył się gem) — liczenie punktów
// zostaje w scoringEngine.js, tu jest tylko wyświetlanie. Tarcza i Pierścień
// znają tylko 0/15/30/40/Ad, więc w tie-breaku wracają do Klapek.
import { useRef } from "react";
import { useThemeCtx } from "../theme.js";
import { ScoreTile, TennisBall } from "./ui.jsx";

export const SCORE_STYLES = ["klapki", "tarcza", "pilka", "pierscien"];
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
const RING_PATHS = [
  "M68.53 12.20 A 52 52 0 0 1 115.80 59.47",
  "M115.80 68.53 A 52 52 0 0 1 68.53 115.80",
  "M59.47 115.80 A 52 52 0 0 1 12.20 68.53",
  "M12.20 59.47 A 52 52 0 0 1 59.47 12.20",
];

// Skala: pełne kafelki są zmniejszone tak, żeby dwie tablice mieściły się w
// 360 px i zostawiały miejsce na duże przyciski punktów; podgląd w menu jest
// jeszcze mniejszy. `zoom` działa w Chromium/WebView Androida.
const FULL = { tarcza: 0.68, pilka: 0.78, pierscien: 0.8 };
const MINI = { tarcza: 0.3, pilka: 0.36, pierscien: 0.38 };

function Dial({ label, forward, k }) {
  const { t } = useThemeCtx();
  const r = useRef({ rot: 0, label: "0" });
  if (r.current.label !== label) {
    let d = (((DIAL_ANGLE[label] ?? 0) - r.current.rot) % 360 + 360) % 360;
    if (!forward && d > 180) d -= 360; // najkrótsza droga, poza końcem gema
    r.current.rot += d;
    r.current.label = label;
  }
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
            <text x="80" y="40">0</text><text x="120" y="80">15</text>
            <text x="80" y="120">30</text><text x="40" y="80">40</text>
            <text x="53" y="53" fontSize="13" fill="#8a6a28">Ad</text>
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
      <span style={{ position: "relative", fontFamily: t.fontScore, fontWeight: 800, fontSize: 62, lineHeight: 1, color: "#2c3510" }}>{label}</span>
    </div>
  );
}

function Ring({ label, k }) {
  const { t } = useThemeCtx();
  const n = RING_FILL[label] ?? 0;
  return (
    <div style={{
      zoom: k, position: "relative", width: 132, height: 132, borderRadius: "50%",
      background: "rgba(0,0,0,.38)", boxShadow: "0 12px 24px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="132" height="132" viewBox="0 0 128 128" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {RING_PATHS.map((d, i) => (
          <path key={i} d={d} fill="none" strokeWidth="10" strokeLinecap="round"
            stroke={i < n ? t.accent : "rgba(255,255,255,.14)"} style={{ transition: "stroke .35s ease" }} />
        ))}
      </svg>
      <span key={label} style={{
        position: "relative", fontFamily: t.fontScore, fontWeight: 800, fontSize: 50, lineHeight: 1,
        color: label === "Ad" ? t.accent : t.text, animation: "sbPop .4s cubic-bezier(.2,.8,.3,1)",
      }}>{label}</span>
    </div>
  );
}

function ServeBall({ side }) {
  return (
    <span style={{
      position: "absolute", top: "50%", zIndex: 3, pointerEvents: "none",
      animation: "ballBounce 0.9s ease-in-out infinite", ...(side === "left" ? { left: -22 } : { right: -22 }),
    }}><TennisBall size={16} /></span>
  );
}

// style: klucz stylu; labels: ["15","30"]; server: "team1" | "team2" | null;
// tiebreak: true w tie-breaku/super tie-breaku; gameEnded: true tuż po wygranym
// gemie (tarcza kręci się wtedy do przodu); compact: miniatura do menu.
export default function ScoreBoard({ style, labels, server, tiebreak = false, gameEnded = false, compact = false }) {
  const { t } = useThemeCtx();
  const eff = tiebreak && (style === "tarcza" || style === "pierscien") ? "klapki" : style;
  const scale = (compact ? MINI : FULL)[eff];
  const cell = (i, side) => {
    const label = labels[i];
    let body;
    if (eff === "klapki") body = <ScoreTile key={label} value={label} size={compact ? "sm" : "lg"} />;
    else if (eff === "tarcza") body = <Dial label={label} forward={gameEnded} k={scale} />;
    else if (eff === "pilka") body = <Ball label={label} k={scale} />;
    else body = <Ring label={label} k={scale} />;
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
