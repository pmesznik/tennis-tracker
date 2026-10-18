// Tennis Tracker v0.2.0 — główny komponent aplikacji.
import { useState, useMemo, useEffect, useRef } from "react";
import { ThemeContext, themeForSurface, makeStyles } from "./theme.js";
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
  const t = themeForSurface(activeSurface);
  const styles = useMemo(() => makeStyles(t), [t]);
  const ctx = useMemo(() => ({ t, styles }), [t, styles]);

  const [lang, setLang] = useState(() => getStoredLang());
  const langCtx = useMemo(() => ({
    lang: lang || "pl",
    setLang: (l) => { setStoredLang(l); setLang(l); },
    t: (key, vars) => translate(lang || "pl", key, vars),
  }), [lang]);

  const [view, setView] = useState({ name: "list" });
  const [listVersion, setListVersion] = useState(0);
  const [showBackup, setShowBackup] = useState(false);
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
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{APP_NAME}</span>
              </span>
              <div style={{
                display: "flex", alignItems: "center", gap: 2, padding: 3, flexShrink: 0,
                background: t.glass, WebkitBackdropFilter: "blur(18px) saturate(1.5)", backdropFilter: "blur(18px) saturate(1.5)",
                border: `1px solid ${t.glassLine}`, borderRadius: 999, boxShadow: t.elev1,
              }}>
                <button onClick={() => setShowBackup(true)} aria-label={langCtx.t("backup.iconTitle")} title={langCtx.t("backup.iconTitle")} style={navIconBtn(t)}>
                  <Icon name="save" size={20} />
                </button>
                <button onClick={() => setView({ name: "tieList" })} aria-label={langCtx.t("tie.iconTitle")} title={langCtx.t("tie.iconTitle")} style={navIconBtn(t)}>
                  <Icon name="trophy" size={20} />
                </button>
                <span aria-hidden="true" style={{ width: 1, height: 22, background: t.glassLine, margin: "0 3px" }} />
                {[["pl", "🇵🇱", "Polski"], ["en", "🇬🇧", "English"]].map(([code, flag, name]) => (
                  <button key={code} onClick={() => langCtx.setLang(code)} aria-label={name} aria-pressed={langCtx.lang === code} title={name}
                    style={{ ...navIconBtn(t), width: 34, fontSize: 17, background: langCtx.lang === code ? t.tonalStrong : "transparent", opacity: langCtx.lang === code ? 1 : 0.55 }}>
                    {flag}
                  </button>
                ))}
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
