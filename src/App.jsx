// Tennis Tracker v0.2.0 — główny komponent aplikacji.
import { useState, useMemo, useEffect, useRef } from "react";
import { ThemeContext, themeForSurface, makeStyles, getStoredPalette, setStoredPalette, PALETTES } from "./theme.js";
import { LangContext, getStoredLang, setStoredLang, translate } from "./i18n.js";
import { APP_NAME, APP_VERSION } from "./version.js";
import MatchListPage from "./matchtracker/MatchListPage.jsx";
import MatchSetupPage from "./matchtracker/MatchSetupPage.jsx";
import MatchTrackerPage from "./matchtracker/MatchTrackerPage.jsx";
import MatchSummaryPage from "./matchtracker/MatchSummaryPage.jsx";
import BackupModal from "./matchtracker/BackupModal.jsx";
import TeamTieListPage from "./matchtracker/TeamTieListPage.jsx";
import TeamTieSetupPage from "./matchtracker/TeamTieSetupPage.jsx";
import TeamTieDetailPage from "./matchtracker/TeamTieDetailPage.jsx";
import { getTeamTie } from "./matchtracker/teamTies.js";
import { Icon } from "./matchtracker/ui.jsx";
import { pushBack, popBack } from "./backStack.js";
import ScoreBoard, { SCORE_STYLES, getStoredScoreStyle, setStoredScoreStyle } from "./matchtracker/scoreboard.jsx";
import appIcon from "./assets/app-icon.svg";

// Ekran przy pierwszym uruchomieniu — wybór języka jest jawny (nie zgadujemy
// z ustawień systemu), żeby uniknąć niespodzianek. Zapamiętany w localStorage,
// da się później zmienić małą flagą w górnym pasku.
function LanguagePickerScreen({ t, styles, onPick }) {
  return (
    <div style={{ ...styles.app, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 24 }}>
      <img src={appIcon} width={96} height={96} alt="" style={{ borderRadius: 26, boxShadow: t.elevFloat }} />
      <span style={{ fontSize: 20, fontWeight: 700, color: t.text }}>Wybierz język / Choose language</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 280 }}>
        <button style={styles.primaryBtn} onClick={() => onPick("pl")}>🇵🇱 Polski</button>
        <button style={styles.secondaryBtn} onClick={() => onPick("en")}>🇬🇧 English</button>
      </div>
    </div>
  );
}


// Dwa chipy wyboru kolorystyki — każdy narysowany w paletach, które reprezentuje
// (tło, tekst i kropki nawierzchni), żeby wybór był od razu widoczny.
function PaletteChips({ current, onPick, tr }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      {PALETTES.map((p) => {
        const pt = themeForSurface(null, p);
        const dots = ["Ziemna", "Twarda", "Trawa"].map((sf) => themeForSurface(sf, p).accent);
        const active = current === p;
        return (
          <button key={p} onClick={() => onPick(p)} aria-pressed={active} style={{
            display: "flex", alignItems: "center", gap: 12, minHeight: 60, padding: "0 20px",
            borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
            background: pt.bg, backgroundImage: pt.bgGradient, color: pt.text,
            border: `2px solid ${active ? pt.accent : pt.borderStrong}`,
            boxShadow: active ? `0 0 0 3px ${pt.accent}33` : "none",
          }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: pt.accent, flexShrink: 0, display: "grid", placeItems: "center", color: pt.bg }}>
              {active && <Icon name="check" size={15} />}
            </span>
            <span style={{ fontSize: 17, fontWeight: 650, flex: 1, textAlign: "left" }}>{tr("palette." + p)}</span>
            <span style={{ display: "flex", gap: 5 }}>
              {dots.map((c) => <i key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c, display: "block" }} />)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Pierwsze uruchomienie: karta z wyborem kolorystyki (po wyborze języka).
function PaletteStartScreen({ t, styles, tr, onPick }) {
  return (
    <div style={{ ...styles.app, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <img src={appIcon} width={80} height={80} alt="" style={{ borderRadius: 22, boxShadow: t.elevFloat }} />
      <div style={{
        width: "100%", maxWidth: 360, background: t.surface, border: `1px solid ${t.glassLine}`,
        borderRadius: t.rLg, padding: "22px 18px 18px", boxShadow: t.elevFloat,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>{tr("palette.title")}</div>
        <div style={{ fontSize: 13.5, color: t.textSub, textAlign: "center", lineHeight: 1.45, margin: "0 6px 18px" }}>{tr("palette.hint")}</div>
        <PaletteChips current={null} onPick={onPick} tr={tr} />
      </div>
    </div>
  );
}

// Zmiana kolorystyki później (z menu): dolny arkusz.
function PaletteSheet({ t, tr, current, onPick, onClose }) {
  useEffect(() => pushBack(onClose), []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: t.overlay, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div role="dialog" aria-label={tr("palette.title")} style={{
        background: t.bg, border: `1px solid ${t.glassLine}`, borderRadius: `${t.rLg}px ${t.rLg}px 0 0`,
        maxWidth: 480, width: "100%", padding: "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))", boxShadow: t.elevFloat,
      }} onClick={(e) => e.stopPropagation()}>
        <div aria-hidden="true" style={{ width: 42, height: 5, borderRadius: 3, background: t.borderStrong, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>{tr("palette.title")}</div>
        <div style={{ fontSize: 13.5, color: t.textSub, margin: "0 0 14px", lineHeight: 1.45 }}>{tr("palette.hint")}</div>
        <PaletteChips current={current} onPick={onPick} tr={tr} />
      </div>
    </div>
  );
}

// Wybór stylu tablicy wyniku (z menu): dolny arkusz z miniaturami 15 : 30.
function ScoreStyleSheet({ t, tr, current, onPick, onClose }) {
  useEffect(() => pushBack(onClose), []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: t.overlay, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div role="dialog" aria-label={tr("scoreStyle.title")} style={{
        background: t.bg, border: `1px solid ${t.glassLine}`, borderRadius: `${t.rLg}px ${t.rLg}px 0 0`,
        maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto",
        padding: "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))", boxShadow: t.elevFloat,
      }} onClick={(e) => e.stopPropagation()}>
        <div aria-hidden="true" style={{ width: 42, height: 5, borderRadius: 3, background: t.borderStrong, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>{tr("scoreStyle.title")}</div>
        <div style={{ fontSize: 13.5, color: t.textSub, margin: "0 0 14px", lineHeight: 1.45 }}>{tr("scoreStyle.hint")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SCORE_STYLES.map((k) => {
            const active = current === k;
            return (
              <button key={k} onClick={() => onPick(k)} aria-pressed={active} aria-label={tr("scoreStyle." + k)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", gap: 8,
                minHeight: 112, padding: "12px 8px 10px", borderRadius: t.rCard, cursor: "pointer", fontFamily: "inherit",
                background: active ? t.tonal : t.surface, color: t.text,
                border: `2px solid ${active ? t.accent : t.glassLine}`,
              }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <ScoreBoard style={k} labels={["15", "30"]} server={null} compact />
                </div>
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, display: "flex", alignItems: "center", gap: 6 }}>
                  {active && <Icon name="check" size={15} />}{tr("scoreStyle." + k)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function navIconBtn(t) {
  return {
    width: 38, height: 38, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer",
    background: "transparent", color: t.text, display: "grid", placeItems: "center", lineHeight: 1,
  };
}

export default function App() {
  // Kolor całej aplikacji zależy od nawierzchni aktualnie zakładanego/oglądanego
  // meczu (null = poza kontekstem meczu → neutralny granat). Patrz theme.js.
  const [activeSurface, setActiveSurface] = useState(null);
  const [palette, setPalette] = useState(() => getStoredPalette());
  const t = themeForSurface(activeSurface, palette || "classic");
  const styles = useMemo(() => makeStyles(t), [t]);
  const [scoreStyle, setScoreStyle] = useState(() => getStoredScoreStyle());
  const ctx = useMemo(() => ({ t, styles, palette: palette || "classic", scoreStyle }), [t, styles, palette, scoreStyle]);

  const [lang, setLang] = useState(() => getStoredLang());
  const langCtx = useMemo(() => ({
    lang: lang || "pl",
    setLang: (l) => { setStoredLang(l); setLang(l); },
    t: (key, vars) => translate(lang || "pl", key, vars),
  }), [lang]);

  const [view, setView] = useState({ name: "list" });
  const [listVersion, setListVersion] = useState(0);
  const [showBackup, setShowBackup] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showScoreStyle, setShowScoreStyle] = useState(false);
  const pickScoreStyle = (k) => { setStoredScoreStyle(k); setScoreStyle(k); setShowScoreStyle(false); };
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const pickPalette = (p) => { setStoredPalette(p); setPalette(p); setShowPalette(false); };
  const goToList = () => {
    setView({ name: "list" });
    setListVersion((v) => v + 1);
    setActiveSurface(null);
  };

  // Przycisk "wstecz" Androida (MainActivity.java woła window.appBack):
  // najpierw zamyka nakładki (okna), potem cofa o jeden ekran, a na liście
  // meczów oddaje sterowanie systemowi (wyjście z aplikacji).
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    window.appBack = () => {
      if (popBack()) return true;
      const v = viewRef.current;
      if (v.name === "list") return false;
      if (v.name === "setup" || v.name === "tracker" || v.name === "summary") {
        if (v.tieId) setView({ name: "tieDetail", tieId: v.tieId });
        else goToList();
      } else if (v.name === "tieSetup" || v.name === "tieDetail") {
        setView({ name: "tieList" });
      } else {
        goToList();
      }
      return true;
    };
    return () => { delete window.appBack; };
  }, []);
  useEffect(() => {
    if (!showBackup) return undefined;
    return pushBack(() => setShowBackup(false));
  }, [showBackup]);
  // Menu w chipie jest chowane: zwija się po dotknięciu poza nim, po wyborze
  // ikony i przyciskiem "wstecz".
  useEffect(() => {
    if (!menuOpen) return undefined;
    const outside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("pointerdown", outside);
    const unback = pushBack(() => setMenuOpen(false));
    return () => { document.removeEventListener("pointerdown", outside); unback(); };
  }, [menuOpen]);

  if (!lang) {
    return (
      <ThemeContext.Provider value={ctx}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body { height: 100%; }
          body { font-family: ${t.fontUi}; color: ${t.text}; background: ${t.bg}; background-image: ${t.bgGradient}; background-attachment: fixed; background-size: cover; }
        `}</style>
        <LanguagePickerScreen t={t} styles={styles} onPick={langCtx.setLang} />
      </ThemeContext.Provider>
    );
  }

  if (!palette) {
    return (
      <ThemeContext.Provider value={ctx}>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body { height: 100%; }
          body { font-family: ${t.fontUi}; color: ${t.text}; background: ${t.bg}; background-image: ${t.bgGradient}; background-attachment: fixed; background-size: cover; }
          button { font-family: inherit; }
        `}</style>
        <PaletteStartScreen t={t} styles={styles} tr={langCtx.t} onPick={pickPalette} />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={ctx}>
      <LangContext.Provider value={langCtx}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { height: 100%; }
        body { font-family: ${t.fontUi}; color: ${t.text}; background: ${t.bg}; background-image: ${t.bgGradient}; background-attachment: fixed; background-size: cover; transition: background-color 0.4s ease; }
        @keyframes tileFlip {
          from { transform: rotateX(85deg); opacity: 0.3; }
          to   { transform: rotateX(0deg);  opacity: 1; }
        }
        @keyframes clockPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes sbSpin { 0% { transform: rotate(-220deg) scale(.82); } 70% { transform: rotate(10deg) scale(1.05); } 100% { transform: rotate(0) scale(1); } }
        @keyframes sbFlicker { 0% { opacity: .1; } 10% { opacity: 1; } 18% { opacity: .25; } 28% { opacity: 1; } 36% { opacity: .5; } 46% { opacity: 1; } 100% { opacity: 1; } }
        @keyframes sbWrite { 0% { clip-path: inset(0 100% 0 0); } 100% { clip-path: inset(0 0 0 0); } }
        @keyframes sbHit { 0% { filter: brightness(1.8); } 100% { filter: brightness(1); } }
        @keyframes sbScan { 0% { clip-path: inset(0 0 100% 0); } 100% { clip-path: inset(0 0 0 0); } }
        @keyframes sbPop { 0% { transform: scale(.5); opacity: .2; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes ballBounce {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(calc(-50% - 5px)); }
        }
        button { font-family: inherit; }
        button:active:not(:disabled) { transform: scale(.985); }
        :focus-visible { outline: 2.5px solid ${t.accent}b3; outline-offset: 2px; }
        input::placeholder { color: ${t.textMuted}; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 4px; }
      `}</style>

      <div style={styles.app}>
        {view.name === "list" && (
          <>
            <nav style={styles.nav}>
              <span style={styles.navTitle}>
                <img src={appIcon} width={32} height={32} alt="" style={{ borderRadius: 9, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", opacity: menuOpen ? 0 : 1, transition: `opacity .2s ${t.ease}` }}>{APP_NAME}</span>
              </span>
              <div ref={menuRef} style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
                <div style={{
                  position: "absolute", right: 48, top: "50%", transform: "translateY(-50%)",
                  display: "flex", alignItems: "center", gap: 2, padding: menuOpen ? 3 : 0, overflow: "hidden",
                  maxWidth: menuOpen ? 300 : 0, opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none",
                  background: t.glass, WebkitBackdropFilter: "blur(18px) saturate(1.5)", backdropFilter: "blur(18px) saturate(1.5)",
                  border: `1px solid ${menuOpen ? t.glassLine : "transparent"}`, borderRadius: 999, boxShadow: menuOpen ? t.elev1 : "none",
                  transition: `max-width .32s ${t.ease}, opacity .2s ${t.ease}, padding .3s ${t.ease}`,
                }}>
                  <button onClick={() => { setMenuOpen(false); setShowBackup(true); }} aria-label={langCtx.t("backup.iconTitle")} title={langCtx.t("backup.iconTitle")} style={navIconBtn(t)} tabIndex={menuOpen ? 0 : -1}>
                    <Icon name="save" size={20} />
                  </button>
                  <button onClick={() => { setMenuOpen(false); setView({ name: "tieList" }); }} aria-label={langCtx.t("tie.iconTitle")} title={langCtx.t("tie.iconTitle")} style={navIconBtn(t)} tabIndex={menuOpen ? 0 : -1}>
                    <Icon name="trophy" size={20} />
                  </button>
                  <button onClick={() => { setMenuOpen(false); setShowPalette(true); }} aria-label={langCtx.t("palette.iconTitle")} title={langCtx.t("palette.iconTitle")} style={navIconBtn(t)} tabIndex={menuOpen ? 0 : -1}>
                    <Icon name="palette" size={20} />
                  </button>
                  <button onClick={() => { setMenuOpen(false); setShowScoreStyle(true); }} aria-label={langCtx.t("scoreStyle.iconTitle")} title={langCtx.t("scoreStyle.iconTitle")} style={navIconBtn(t)} tabIndex={menuOpen ? 0 : -1}>
                    <Icon name="timer" size={20} />
                  </button>
                  <span aria-hidden="true" style={{ width: 1, height: 22, background: t.glassLine, margin: "0 3px", flexShrink: 0 }} />
                  {[["pl", "🇵🇱", "Polski"], ["en", "🇬🇧", "English"]].map(([code, flag, name]) => (
                    <button key={code} onClick={() => { langCtx.setLang(code); setMenuOpen(false); }} aria-label={name} aria-pressed={langCtx.lang === code} title={name} tabIndex={menuOpen ? 0 : -1}
                      style={{ ...navIconBtn(t), width: 34, fontSize: 17, background: langCtx.lang === code ? t.tonalStrong : "transparent", opacity: langCtx.lang === code ? 1 : 0.55 }}>
                      {flag}
                    </button>
                  ))}
                </div>
                <button onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label={langCtx.t(menuOpen ? "menu.close" : "menu.open")} style={{
                  position: "absolute", right: 0, top: 1, width: 40, height: 40, borderRadius: "50%", cursor: "pointer",
                  background: menuOpen ? t.tonalStrong : t.glass, color: t.text, border: `1px solid ${t.glassLine}`,
                  WebkitBackdropFilter: "blur(18px) saturate(1.5)", backdropFilter: "blur(18px) saturate(1.5)",
                  display: "grid", placeItems: "center", padding: 0, boxShadow: t.elev1,
                }}>
                  <Icon name={menuOpen ? "close" : "more"} size={22} />
                </button>
              </div>
            </nav>
            <MatchListPage
              key={listVersion}
              onNewMatch={() => setView({ name: "setup", mode: "track" })}
              onSaveResult={() => setView({ name: "setup", mode: "manual" })}
              onOpenMatch={(m) => {
                setActiveSurface(m.surface || null);
                setView(m.status === "in_progress" ? { name: "tracker", matchId: m.id } : { name: "summary", matchId: m.id });
              }}
            />
            <div style={{ textAlign: "center", fontSize: 12, color: t.textMuted, padding: "0 0 calc(20px + env(safe-area-inset-bottom, 0px))" }}>
              {APP_NAME} v{APP_VERSION}
            </div>
          </>
        )}

        {view.name === "setup" && (
          <MatchSetupPage
            mode={view.mode}
            onCancel={view.tieId ? () => setView({ name: "tieDetail", tieId: view.tieId }) : goToList}
            onSurfaceChange={setActiveSurface}
            tieContext={(() => {
              if (!view.tieId) return null;
              const tie = getTeamTie(view.tieId);
              return tie ? { tieId: tie.id, team1Name: tie.team1Name, team2Name: tie.team2Name } : null;
            })()}
            onCreated={(m) => setView(m.status === "in_progress" ? { name: "tracker", matchId: m.id, tieId: view.tieId } : { name: "summary", matchId: m.id, tieId: view.tieId })}
          />
        )}

        {view.name === "tracker" && (
          <MatchTrackerPage
            matchId={view.matchId}
            onBack={view.tieId ? () => setView({ name: "tieDetail", tieId: view.tieId }) : goToList}
            onSurfaceChange={setActiveSurface}
            onFinished={(m) => setView({ name: "summary", matchId: m.id, tieId: view.tieId })}
          />
        )}

        {view.name === "summary" && (
          <MatchSummaryPage
            matchId={view.matchId}
            onBack={view.tieId ? () => setView({ name: "tieDetail", tieId: view.tieId }) : goToList}
            onDeleted={view.tieId ? () => setView({ name: "tieDetail", tieId: view.tieId }) : goToList}
            onSurfaceChange={setActiveSurface}
            onContinue={(id) => setView({ name: "tracker", matchId: id, tieId: view.tieId })}
          />
        )}

        {view.name === "tieList" && (
          <TeamTieListPage
            onBack={goToList}
            onNewTie={() => setView({ name: "tieSetup" })}
            onOpenTie={(tie) => setView({ name: "tieDetail", tieId: tie.id })}
          />
        )}

        {view.name === "tieSetup" && (
          <TeamTieSetupPage
            onBack={() => setView({ name: "tieList" })}
            onCreated={(tie) => setView({ name: "tieDetail", tieId: tie.id })}
          />
        )}

        {view.name === "tieDetail" && (
          <TeamTieDetailPage
            tieId={view.tieId}
            onBack={() => setView({ name: "tieList" })}
            onDeleted={() => setView({ name: "tieList" })}
            onAddMatch={(mode) => setView({ name: "setup", mode, tieId: view.tieId })}
            onOpenMatch={(m) => {
              setActiveSurface(m.surface || null);
              setView(m.status === "in_progress" ? { name: "tracker", matchId: m.id, tieId: view.tieId } : { name: "summary", matchId: m.id, tieId: view.tieId });
            }}
          />
        )}
      </div>
      {showScoreStyle && (
        <ScoreStyleSheet t={t} tr={langCtx.t} current={scoreStyle} onPick={pickScoreStyle} onClose={() => setShowScoreStyle(false)} />
      )}
      {showPalette && (
        <PaletteSheet t={t} tr={langCtx.t} current={palette} onPick={pickPalette} onClose={() => setShowPalette(false)} />
      )}
      {showBackup && (
        <BackupModal
          onClose={() => setShowBackup(false)}
          onImported={() => setListVersion((v) => v + 1)}
        />
      )}
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}
