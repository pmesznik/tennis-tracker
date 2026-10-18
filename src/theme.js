// ─────────────────────────────────────────────────────────────────────────────
// theme.js — Tennis Tracker v0.2.0 — motyw zależny od nawierzchni kortu, nie od
// jasny/ciemny. Poza konkretnym meczem (lista, brak wybranej nawierzchni)
// aplikacja jest w neutralnym granacie; gdy zakłada się mecz albo się go
// śledzi/przegląda, cała apka przebarwia się zgodnie z nawierzchnią:
//   Ziemna (glina) → odcienie pomarańczu/terakoty
//   Twarda          → odcienie niebieskiego
//   Trawa           → odcienie zieleni
// Każda nawierzchnia ma jeden, spójny wygląd (bez osobnych wersji jasny/ciemny).
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext } from "react";
import { LUSTER_WHITE, ASTER_FLOWER_BLUE, HABANERO, DEEP_SPACE_ROYAL, DEADLY_DEPTHS } from "./palette.js";

export const ThemeContext = createContext(null);
export function useThemeCtx() { return useContext(ThemeContext); }

// Nawierzchnie obsługiwane przez tracker — używane też w MatchSetupPage.
export const SURFACES = ["Ziemna", "Twarda", "Trawa"];

const DANGER = "#ef4444";
const SUCCESS = "#10b981";

// ─── NEUTRALNY (lista meczów, ekran bez wybranej nawierzchni) ────────────────
const NEUTRAL = {
  key: "neutral",
  accent: HABANERO, accent2: "#ffab4d",
  secondary: DEEP_SPACE_ROYAL, secondarySoft: ASTER_FLOWER_BLUE,
  danger: DANGER, success: SUCCESS,
  bg: DEADLY_DEPTHS,
  bgGradient: `
    radial-gradient(circle at 12% -10%, rgba(155,172,216,0.22) 0%, transparent 42%),
    radial-gradient(circle at 100% 105%, rgba(249,133,19,0.16) 0%, transparent 46%),
    linear-gradient(165deg, #0c0c33 0%, #111144 38%, #1b2456 72%, #223382 100%)
  `,
  navBg: "rgba(17,17,68,0.92)",
  surface: "rgba(155,172,216,0.08)",
  surfaceElevated: "rgba(155,172,216,0.14)",
  border: "rgba(155,172,216,0.20)",
  borderStrong: "rgba(155,172,216,0.32)",
  text: LUSTER_WHITE,
  textSub: "rgba(244,241,236,0.62)",
  textMuted: "rgba(244,241,236,0.38)",
  inputBg: "rgba(155,172,216,0.12)",
  cardShadow: "none",
  scrollbar: "rgba(155,172,216,0.3)",
  overlay: "rgba(6,6,26,0.7)",
};

// ─── ZIEMNA / GLINA — terakota, jak Roland Garros ────────────────────────────
const CLAY = {
  key: "clay",
  // Terakota pomiędzy pełnym Habañero (zbyt jaskrawy) a stonowanym brązem
  // (zbyt mdły) — nasycony, ale nie neonowy pomarańcz.
  accent: "#e8813f", accent2: "#f5b877",
  secondary: "#b8622f", secondarySoft: "#e8c19a",
  danger: DANGER, success: SUCCESS,
  bg: "#241812",
  bgGradient: `
    radial-gradient(circle at 12% -10%, rgba(224,196,168,0.14) 0%, transparent 42%),
    radial-gradient(circle at 100% 105%, rgba(165,97,63,0.20) 0%, transparent 48%),
    linear-gradient(165deg, #201510 0%, #33231a 35%, #533626 72%, #714632 100%)
  `,
  navBg: "rgba(32,21,16,0.92)",
  surface: "rgba(224,196,168,0.08)",
  surfaceElevated: "rgba(224,196,168,0.14)",
  border: "rgba(224,196,168,0.18)",
  borderStrong: "rgba(224,196,168,0.28)",
  text: LUSTER_WHITE,
  textSub: "rgba(255,241,230,0.62)",
  textMuted: "rgba(255,241,230,0.38)",
  inputBg: "rgba(224,196,168,0.11)",
  cardShadow: "none",
  scrollbar: "rgba(224,196,168,0.28)",
  overlay: "rgba(16,9,6,0.7)",
};

// ─── TWARDA — niebieski, jak US Open / Australian Open ───────────────────────
const HARD = {
  key: "hard",
  accent: "#38bdf8", accent2: "#7dd3fc",
  secondary: DEEP_SPACE_ROYAL, secondarySoft: ASTER_FLOWER_BLUE,
  danger: DANGER, success: SUCCESS,
  bg: "#071b33",
  bgGradient: `
    radial-gradient(circle at 12% -10%, rgba(125,211,252,0.22) 0%, transparent 42%),
    radial-gradient(circle at 100% 105%, rgba(56,189,248,0.20) 0%, transparent 48%),
    linear-gradient(165deg, #050f24 0%, #0d1f45 35%, #1a3a75 72%, #2456a8 100%)
  `,
  navBg: "rgba(5,15,36,0.92)",
  surface: "rgba(155,172,216,0.09)",
  surfaceElevated: "rgba(155,172,216,0.16)",
  border: "rgba(125,211,252,0.22)",
  borderStrong: "rgba(125,211,252,0.34)",
  text: LUSTER_WHITE,
  textSub: "rgba(230,244,255,0.65)",
  textMuted: "rgba(230,244,255,0.4)",
  inputBg: "rgba(125,211,252,0.13)",
  cardShadow: "none",
  scrollbar: "rgba(125,211,252,0.3)",
  overlay: "rgba(3,10,20,0.7)",
};

// ─── TRAWA — zieleń, jak Wimbledon ────────────────────────────────────────────
const GRASS = {
  key: "grass",
  accent: "#4ade80", accent2: "#bef264",
  secondary: "#2f7d4f", secondarySoft: "#9ccfa0",
  danger: DANGER, success: SUCCESS,
  bg: "#06210f",
  bgGradient: `
    radial-gradient(circle at 12% -10%, rgba(190,242,100,0.20) 0%, transparent 42%),
    radial-gradient(circle at 100% 105%, rgba(34,139,34,0.26) 0%, transparent 48%),
    linear-gradient(165deg, #04170c 0%, #0c2a17 35%, #1f5030 72%, #2f7d4f 100%)
  `,
  navBg: "rgba(4,23,12,0.92)",
  surface: "rgba(190,242,100,0.08)",
  surfaceElevated: "rgba(190,242,100,0.15)",
  border: "rgba(190,242,100,0.20)",
  borderStrong: "rgba(190,242,100,0.32)",
  text: LUSTER_WHITE,
  textSub: "rgba(235,255,235,0.65)",
  textMuted: "rgba(235,255,235,0.4)",
  inputBg: "rgba(190,242,100,0.12)",
  cardShadow: "none",
  scrollbar: "rgba(190,242,100,0.3)",
  overlay: "rgba(2,12,7,0.7)",
};


// ─── NOWOCZESNA PALETA (opcjonalna, wybór przy pierwszym uruchomieniu) ───────
// Ta sama zasada co klasyczna (kolor wg nawierzchni), ale prawie czarne tła z
// kolorową poświatą w rogu, jeden żywy akcent na nawierzchnię i jasny tekst.
function modernTheme(key, o) {
  return {
    key, accent: o.accent, accent2: o.accent2,
    secondary: o.secondary, secondarySoft: o.accent2,
    danger: DANGER, success: SUCCESS,
    bg: o.bg,
    bgGradient: `
      radial-gradient(120% 60% at 0% 0%, rgba(${o.glow},0.26) 0%, transparent 55%),
      radial-gradient(90% 50% at 100% 100%, rgba(${o.glow2},0.10) 0%, transparent 60%),
      linear-gradient(180deg, ${o.bg} 0%, ${o.bg} 100%)
    `,
    navBg: `rgba(${o.navRgb},0.82)`,
    surface: `rgba(${o.tint},0.07)`,
    surfaceElevated: `rgba(${o.tint},0.13)`,
    border: `rgba(${o.tint},0.14)`,
    borderStrong: `rgba(${o.tint},0.26)`,
    text: o.text,
    textSub: `rgba(${o.textRgb},0.68)`,
    textMuted: `rgba(${o.textRgb},0.42)`,
    inputBg: `rgba(${o.tint},0.09)`,
    cardShadow: "none",
    scrollbar: `rgba(${o.tint},0.3)`,
    overlay: "rgba(3,3,8,0.72)",
    bigA: { bg: o.accent, fg: "#0A0A12" },
    bigB: { bg: o.bigB, fg: o.text },
  };
}
const M_NEUTRAL = modernTheme("neutral", { bg: "#0A0A12", accent: "#FF3D81", accent2: "#C6FF00", secondary: "#8f1747", glow: "255,31,107", glow2: "198,255,0", navRgb: "10,10,18", tint: "255,255,255", text: "#F4F4FA", textRgb: "244,244,250", bigB: "#26212e" });
const M_CLAY = modernTheme("clay", { bg: "#120B09", accent: "#FF7A3D", accent2: "#FFB58A", secondary: "#9a4420", glow: "255,107,53", glow2: "255,180,138", navRgb: "18,11,9", tint: "255,170,120", text: "#FFF3EC", textRgb: "255,243,236", bigB: "#2c1a13" });
const M_HARD = modernTheme("hard", { bg: "#070E1A", accent: "#3FB6FF", accent2: "#8FE0FF", secondary: "#16608f", glow: "40,170,255", glow2: "120,220,255", navRgb: "7,14,26", tint: "120,200,255", text: "#EEF7FF", textRgb: "238,247,255", bigB: "#12243a" });
const M_GRASS = modernTheme("grass", { bg: "#06100A", accent: "#4DE58A", accent2: "#B6FF7A", secondary: "#1f7a44", glow: "70,230,120", glow2: "190,255,110", navRgb: "6,16,10", tint: "130,245,175", text: "#EFFFF4", textRgb: "239,255,244", bigB: "#10261a" });

const THEME_BY_SURFACE = { Ziemna: CLAY, Twarda: HARD, Trawa: GRASS };

// Tokeny z STANDARD_DESIGNU (zaokrąglenia, odstępy, dotyk, ruch) wspólne dla
// wszystkich motywów; tonal = tło przycisków/chipów/ikon barwione akcentem,
// glass = półprzezroczyste tło elementów pływających nad treścią.
const FONT_UI = "system-ui, Roboto, 'Segoe UI', sans-serif";
const FONT_SCORE = "'Barlow Condensed', 'Roboto Condensed', Roboto, sans-serif";
function withTokens(theme) {
  return {
    ...theme,
    bigA: theme.bigA || { bg: theme.secondary, fg: "#fff" },
    bigB: theme.bigB || { bg: theme.secondarySoft, fg: "#fff" },
    rLg: 28, rCard: 20, rMd: 16, rSm: 12,
    sp1: 4, sp2: 8, sp3: 12, sp4: 16, sp5: 24,
    touch: 46,
    ease: "cubic-bezier(.2,.8,.2,1)",
    fontUi: FONT_UI, fontScore: FONT_SCORE,
    tonal: `${theme.accent}24`,
    tonalStrong: `${theme.accent}3d`,
    glass: theme.navBg,
    glassLine: "rgba(255,255,255,0.10)",
    elev1: "0 1px 2px rgba(0,0,0,0.28), 0 3px 10px rgba(0,0,0,0.22)",
    elevFloat: "0 6px 24px rgba(0,0,0,0.35)",
  };
}
const TOKENIZED = {
  classic: {
    neutral: withTokens(NEUTRAL), clay: withTokens(CLAY), hard: withTokens(HARD), grass: withTokens(GRASS),
  },
  modern: {
    neutral: withTokens(M_NEUTRAL), clay: withTokens(M_CLAY), hard: withTokens(M_HARD), grass: withTokens(M_GRASS),
  },
};
const SURFACE_KEY = { Ziemna: "clay", Twarda: "hard", Trawa: "grass" };

export const PALETTE_KEY = "atz_palette";
export const PALETTES = ["classic", "modern"];
export function getStoredPalette() {
  try {
    const v = localStorage.getItem(PALETTE_KEY);
    return PALETTES.includes(v) ? v : null;
  } catch {
    return null;
  }
}
export function setStoredPalette(p) {
  try {
    localStorage.setItem(PALETTE_KEY, p);
  } catch {}
}

// surface: nazwa nawierzchni ("Ziemna"/"Twarda"/"Trawa") albo null/undefined
// (brak kontekstu meczu → neutralny granat).
export function themeForSurface(surface, palette = "classic") {
  const set = TOKENIZED[palette] || TOKENIZED.classic;
  return set[SURFACE_KEY[surface] || "neutral"];
}

export function surfaceDotColor(surface) {
  return THEME_BY_SURFACE[surface]?.accent || null;
}

export function makeStyles(t) {
  return {
    app: {
      fontFamily: t.fontUi,
      fontSize: 15, lineHeight: 1.4,
      background: "transparent",
      minHeight: "100vh",
      color: t.text,
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
    },
    nav: {
      position: "sticky", top: 0, zIndex: 100,
      padding: "calc(10px + env(safe-area-inset-top, 0px)) 14px 8px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 10,
    },
    navTitle: {
      display: "flex", alignItems: "center", gap: 8, minWidth: 0,
      fontSize: 17, fontWeight: 700, letterSpacing: "0.01em", color: t.text,
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    },
    page: { padding: "8px 16px calc(24px + env(safe-area-inset-bottom, 0px))" },
    card: {
      background: t.surface,
      border: `1px solid ${t.glassLine}`,
      boxShadow: t.elev1,
      borderRadius: t.rCard, overflow: "hidden", marginBottom: 12,
    },
    iconBtn: {
      background: t.tonal, border: "none",
      borderRadius: t.rSm, color: t.text,
      minWidth: 40, minHeight: 40, padding: "0 10px", cursor: "pointer",
      fontFamily: "inherit", fontWeight: 600, flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    },
    primaryBtn: {
      background: t.accent,
      color: "#0A0A12", border: "none", borderRadius: 14,
      fontSize: 15, fontWeight: 700, padding: "11px 16px", minHeight: 48,
      cursor: "pointer", fontFamily: "inherit",
      width: "100%", boxShadow: t.elev1,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    },
    secondaryBtn: {
      background: t.tonal, color: t.text, border: "none",
      borderRadius: 14, fontSize: 15, fontWeight: 600, padding: "11px 14px", minHeight: t.touch,
      cursor: "pointer", fontFamily: "inherit", width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    },
    input: {
      width: "100%", background: t.inputBg, border: `1px solid ${t.borderStrong}`,
      borderRadius: 14, padding: "10px 12px", minHeight: t.touch, fontSize: 16, color: t.text,
      fontFamily: "inherit", outline: "none", boxSizing: "border-box",
    },
    label: {
      fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
      color: t.textSub, margin: "12px 0 6px", display: "block",
    },
    centered: {
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 10, padding: "60px 20px", color: t.textMuted, textAlign: "center",
    },
  };
}
