// ─────────────────────────────────────────────────────────────────────────────
// Tennis Tracker v0.2.0
// ui.jsx — małe, współdzielone komponenty wizualne używane na kilku ekranach
// trackera (duże przyciski akcji, karta, pasek górny).
// ─────────────────────────────────────────────────────────────────────────────
import { useThemeCtx } from "../theme.js";
import { useLang } from "../i18n.js";
import { formatDuration } from "./time.js";

// Ikonka piłki tenisowej narysowana w SVG — stałe, spójne renderowanie na
// każdym urządzeniu (emoji 🎾 wygląda różnie zależnie od systemu/producenta,
// bywa mylona z rakietką).
export function TennisBall({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10.5" fill="#d6f24c" stroke="#8caa1f" strokeWidth="1" />
      <path d="M2.2 8.2 Q12 3, 21.8 8.2" stroke="#fff" strokeWidth="1.6" fill="none" />
      <path d="M2.2 15.8 Q12 21, 21.8 15.8" stroke="#fff" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

// Zegar w stylistyce tablicy wyników (ten sam ciemny gradient co ScoreTile) —
// pulsująca kropka + cyfry tabularne. `tone` przełącza kolor: "accent" (zegar
// meczu), "muted"/"warning"/"danger" (zegar punktu, wg progów zegara
// serwisowego ATP/WTA — 15s i 25s).
export function ClockChip({ ms, tone = "accent", pulse = false, small = false }) {
  const { t } = useThemeCtx();
  const color = tone === "danger" ? t.danger : tone === "warning" ? "#f0a93a" : tone === "muted" ? t.textSub : t.accent;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: small ? 5 : 6,
      background: "linear-gradient(180deg, #2a3154 0%, #171b30 100%)",
      border: `1px solid ${color}55`, borderRadius: 20,
      padding: small ? "3px 8px 3px 7px" : "5px 10px 5px 8px",
      boxShadow: "0 3px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
      flexShrink: 0,
    }}>
      <span style={{
        width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: "50%", background: color,
        boxShadow: `0 0 6px ${color}`, flexShrink: 0,
        animation: pulse ? "clockPulse 1s ease-in-out infinite" : "none",
      }} />
      <span style={{
        fontFamily: "monospace", fontVariantNumeric: "tabular-nums", fontWeight: 700,
        fontSize: small ? 11.5 : 13, color, letterSpacing: "0.02em",
      }}>{formatDuration(ms)}</span>
    </span>
  );
}

// Klasyczna ikonka "udostępnij" (Material Design) — trzy połączone kropki,
// zamiast emoji 📤/🔗, które różnie się renderują między systemami.
export function ShareIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}

// Spójny zestaw ikon (Material) zamiast emoji, które różnie wyglądają na
// różnych telefonach. Kolor bierze z `currentColor`.
const ICON_PATHS = {
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  trash: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  trophy: "M19 5h-2V3H7v2H5a2 2 0 0 0-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.95V19H7v2h10v-2h-4v-3.1c1.63-.32 2.98-1.45 3.61-2.95C19.08 12.63 21 10.55 21 8V7a2 2 0 0 0-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z",
  save: "M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  upload: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  calendar: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11zM7 11h5v5H7z",
  play: "M8 5v14l11-7z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  starOutline: "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};
export function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function TopBar({ title, onBack, right }) {
  const { t } = useThemeCtx();
  const { t: tr } = useLang();
  return (
    <div style={{
      flexShrink: 0, background: t.glass, WebkitBackdropFilter: "blur(18px) saturate(1.5)", backdropFilter: "blur(18px) saturate(1.5)",
      borderBottom: `1px solid ${t.glassLine}`, padding: "8px 12px",
      paddingTop: "calc(8px + env(safe-area-inset-top, 0px))",
      display: "flex", alignItems: "center", gap: 10, minHeight: 56,
    }}>
      {onBack && (
        <button onClick={onBack} aria-label={tr("common.back")} style={{
          width: 44, height: 44, borderRadius: "50%", border: "none", flexShrink: 0,
          background: t.tonal, color: t.text, cursor: "pointer",
          display: "grid", placeItems: "center", padding: 0,
        }}><Icon name="back" size={22} /></button>
      )}
      <span style={{
        fontSize: 17, fontWeight: 650, color: t.text, flex: 1, letterSpacing: "0.005em",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{title}</span>
      {right}
    </div>
  );
}

export function FullScreen({ children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, background: "transparent",
      maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column",
    }}>
      {children}
    </div>
  );
}

export function ScrollBody({ children, style }) {
  return (
    <div style={{
      flex: 1, minHeight: 0, overflowY: "auto",
      paddingBottom: "env(safe-area-inset-bottom, 0px)", ...style,
    }}>
      {children}
    </div>
  );
}

// Duży, dotykowy przycisk akcji (jak w ekranach punktowania) — kolor
// konfigurowalny, domyślnie niebieski jak w referencyjnej aplikacji.
export function BigButton({ label, sub, onClick, color, tall = false, disabled = false, style }) {
  const { t } = useThemeCtx();
  const bg = color || t.secondary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", minHeight: tall ? 160 : 84,
        background: disabled ? "#5b6472" : bg,
        color: "#fff", border: "none", borderRadius: t.rCard,
        boxShadow: t.elev1,
        fontSize: 18, fontWeight: 700, fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 4, opacity: disabled ? 0.6 : 1, padding: "10px 12px", textAlign: "center",
        ...style,
      }}
    >
      <span style={{ whiteSpace: "pre-line" }}>{label}</span>
      {sub && <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </button>
  );
}

export function ButtonGrid({ children, columns = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, padding: 16 }}>
      {children}
    </div>
  );
}

export function Card({ children, style }) {
  const { t } = useThemeCtx();
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.glassLine}`,
      boxShadow: t.elev1, borderRadius: t.rCard, overflow: "hidden",
      marginBottom: 12, ...style,
    }}>
      {children}
    </div>
  );
}

// Kafelek jak w mechanicznej tablicy wyników (split-flap) — użyj z key={value}
// w miejscu wywołania, żeby animacja "przewracania" odtwarzała się przy
// każdej zmianie liczby/etykiety. `serving` dokłada z boku kafelka małą,
// odbijającą się piłeczkę — dodatkowa (redundantna z nazwiskiem w nagłówku),
// ale czytelna "jednym rzutem oka" wskazówka, kto akurat serwuje. `servingSide`
// wskazuje zewnętrzny bok kafelka (żeby piłeczka nie wchodziła w dwukropek
// między dwoma kafelkami).
export function ScoreTile({ value, size = "lg", serving = false, servingSide = "right" }) {
  const { t } = useThemeCtx();
  const big = size === "lg";
  return (
    <div style={{ position: "relative" }}>
      {serving && (
        <span style={{
          position: "absolute", top: "50%", zIndex: 3, pointerEvents: "none",
          animation: "ballBounce 0.9s ease-in-out infinite",
          ...(servingSide === "left" ? { left: -20 } : { right: -20 }),
        }}>
          <TennisBall size={14} />
        </span>
      )}
      <div style={{
        position: "relative", minWidth: big ? 56 : 36, height: big ? 68 : 42,
        background: "linear-gradient(180deg, #2a3154 0%, #171b30 100%)",
        borderRadius: 9, boxShadow: "0 5px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", padding: "0 6px", animation: "tileFlip 0.32s ease",
        transformOrigin: "center top",
      }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "rgba(0,0,0,0.45)", zIndex: 2 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 55%)" }} />
        <span style={{
          position: "relative", zIndex: 1, color: t.accent, fontWeight: 800,
          fontSize: big ? 32 : 18, lineHeight: 1, fontFamily: t.fontScore,
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}>{value}</span>
      </div>
    </div>
  );
}

export function Chip({ label, active, onClick, color }) {
  const { t } = useThemeCtx();
  const c = color || t.accent;
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, minHeight: 36,
      fontSize: 13, fontWeight: active ? 650 : 500, padding: "6px 13px", borderRadius: 999,
      border: `1px solid ${active ? c : t.borderStrong}`,
      background: active ? `${c}33` : t.inputBg,
      color: t.text, cursor: "pointer", fontFamily: "inherit",
    }}>
      {active && <span aria-hidden="true">✓</span>}{label}
    </button>
  );
}
