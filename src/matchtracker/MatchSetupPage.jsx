// Tennis Tracker v0.2.0 — ekran zakładania nowego meczu / zapisu ręcznego wyniku.
import { useState, useMemo, useEffect } from "react";
import { useThemeCtx, SURFACES, themeForSurface } from "../theme.js";
import { useLang, surfaceLabel } from "../i18n.js";
import { Card, TopBar, FullScreen, ScrollBody, Chip, Icon } from "./ui.jsx";
import { pushBack } from "../backStack.js";
import * as storage from "./storage.js";
import { PRESETS, DEFAULT_PRESET_KEY } from "./scoringEngine.js";
import { buildPlayerIndex, suggestOpponents, canonicalName, getFavoritePlayers, toggleFavoritePlayer } from "./players.js";
import { normName } from "./nameKey.js";
import { manualRowsToSets } from "./matchEdit.js";
import { addMatchToTie } from "./teamTies.js";
import { getProfile } from "./profile.js";

const DEPTHS = [
  { key: "basic", titleKey: "depth.basic.title", descKey: "depth.basic.desc" },
  { key: "intermediate", titleKey: "depth.intermediate.title", descKey: "depth.intermediate.desc" },
  { key: "advanced", titleKey: "depth.advanced.title", descKey: "depth.advanced.desc" },
  { key: "advanced_rallies", titleKey: "depth.advancedRallies.title", descKey: "depth.advancedRallies.desc" },
];

function TabBtn({ active, onClick, children }) {
  const { t } = useThemeCtx();
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      flex: 1, minHeight: 40, padding: "8px 6px", border: "none", borderRadius: 999,
      background: active ? t.tonalStrong : "transparent",
      color: active ? t.text : t.textSub, fontWeight: active ? 700 : 500,
      fontSize: 14, cursor: "pointer", fontFamily: "inherit",
    }}>{children}</button>
  );
}

// Kafelek wyboru nawierzchni — kolorowany wg własnego motywu (nie bieżącego
// t), żeby od razu podpowiadał, na jaki kolor przebarwi się cała apka.
function SurfaceTile({ surface, active, onClick }) {
  const { t, palette } = useThemeCtx();
  const { lang } = useLang();
  const stheme = themeForSurface(surface, palette);
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "16px 6px", borderRadius: t.rMd, cursor: "pointer", fontFamily: "inherit", minHeight: 76,
      border: `2px solid ${active ? stheme.accent : t.borderStrong}`,
      background: active ? `${stheme.accent}22` : t.surfaceElevated,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: stheme.accent, boxShadow: `0 0 10px ${stheme.accent}88` }} />
      <span style={{ fontSize: 14, fontWeight: 650, color: active ? stheme.accent : t.text }}>{surfaceLabel(lang, surface)}</span>
    </button>
  );
}

// Kafelek zasad meczu — pokazywany od razu na stronie (bez okienka), w stylu
// reszty apki. Zaznaczony ma ramkę i haczyk w kolorze akcentu.
function RulesTile({ preset, active, onClick }) {
  const { t } = useThemeCtx();
  const { t: tr } = useLang();
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
      border: `2px solid ${active ? t.accent : t.borderStrong}`,
      background: active ? `${t.accent}18` : t.surfaceElevated,
      borderRadius: t.rMd, padding: 14, marginBottom: 10,
    }}>
      <div style={{ fontSize: 15, fontWeight: 650, color: active ? t.accent : t.text }}>
        {active ? "✓ " : ""}{tr(preset.labelKey)}
      </div>
      <div style={{ fontSize: 12, color: t.textSub, marginTop: 6 }}>{preset.bulletKeys.map((k) => tr(k)).join(" · ")}</div>
    </button>
  );
}

// Pole nazwiska z gwiazdką ulubionego, chipami ulubionych (wypełniają to
// pole jednym dotknięciem) i podpowiedziami przeciwników wyliczonymi z
// historii meczów tego akurat gracza (drugie pole).
function NameField({ label, value, onChange, favorites, onToggleFavorite, suggestions, placeholder, listId }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const isFav = favorites.some((n) => normName(n) === normName(value));
  return (
    <>
      <span style={styles.label}>{label}</span>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          style={{ ...styles.input, flex: 1, minWidth: 0 }} value={value} list={listId}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        />
        <button
          onClick={() => onToggleFavorite(value)} disabled={!value.trim()}
          title={tr("setup.favoriteToggle")}
          style={{
            width: t.touch, flexShrink: 0, borderRadius: 14, border: `1px solid ${t.borderStrong}`,
            background: t.surfaceElevated, color: isFav ? t.accent : t.textMuted,
            display: "grid", placeItems: "center", padding: 0,
            cursor: value.trim() ? "pointer" : "default", opacity: value.trim() ? 1 : 0.5,
          }}
          aria-label={tr("setup.favoriteToggle")} aria-pressed={isFav}
        ><Icon name={isFav ? "star" : "starOutline"} size={22} /></button>
      </div>
      <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {favorites.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {favorites.map((name) => (
              <Chip key={name} label={`★ ${name}`} active={normName(value) === normName(name)} onClick={() => onChange(name)} />
            ))}
          </div>
        )}
        {suggestions.length > 0 && (
          <div>
            <span style={{ fontSize: 11, color: t.textMuted, display: "block", marginBottom: 6 }}>{tr("setup.playedBefore")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {suggestions.map((name) => (
                <Chip key={name} label={name} active={normName(value) === normName(name)} onClick={() => onChange(name)} color={t.secondarySoft} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DepthPickerModal({ onPick, onClose }) {
  const { t } = useThemeCtx();
  const { t: tr } = useLang();
  useEffect(() => pushBack(onClose), []);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400, background: t.overlay,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div role="dialog" aria-label={tr("setup.pickDepthTitle")} style={{
        background: t.bg, border: `1px solid ${t.glassLine}`, borderRadius: `${t.rLg}px ${t.rLg}px 0 0`,
        maxWidth: 480, width: "100%", maxHeight: "86vh", overflowY: "auto",
        padding: "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))", boxShadow: t.elevFloat,
      }} onClick={(e) => e.stopPropagation()}>
        <div aria-hidden="true" style={{ width: 42, height: 5, borderRadius: 3, background: t.borderStrong, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{tr("setup.pickDepthTitle")}</div>
        {DEPTHS.map((d) => (
          <Card key={d.key} style={{ cursor: "pointer" }}>
            <div role="button" tabIndex={0} style={{ padding: "14px 16px", minHeight: 64 }} onClick={() => onPick(d.key)}>
              <div style={{ fontSize: 17, fontWeight: 650, color: t.secondarySoft }}>{tr(d.titleKey)}</div>
              <div style={{ fontSize: 13, color: t.textSub, marginTop: 4, lineHeight: 1.4 }}>{tr(d.descKey)}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function MatchSetupPage({ mode, onCancel, onCreated, onSurfaceChange, tieContext }) {
  const { t, styles, palette } = useThemeCtx();
  const { lang, t: tr } = useLang();
  const isManual = mode === "manual";
  const [tab, setTab] = useState("players");

  const [isDoubles, setIsDoubles] = useState(false);
  // Główny zawodnik ze strony startowej jest od razu wpisany (nie w trybie
  // „mecze innych osób" i nie w meczu drużynowym).
  const [t1a, setT1a] = useState(() => {
    const p = getProfile();
    return p.name && !p.others && !tieContext ? p.name : "";
  });
  const [t1b, setT1b] = useState("");
  const [t2a, setT2a] = useState("");
  const [t2b, setT2b] = useState("");

  const [presetKey, setPresetKey] = useState(DEFAULT_PRESET_KEY);
  // Decydujący set: null = tak jak w wybranym zestawie, albo wymuszony pełny
  // set (z tie-breakiem) / super tie-break do 10.
  const [finalSetMode, setFinalSetMode] = useState(null);
  const basePreset = PRESETS[presetKey];
  const [startAt22, setStartAt22] = useState(false);
  const composed = finalSetMode && basePreset.sets >= 3
    ? { ...basePreset, finalSetSuperTiebreak: finalSetMode === "super" }
    : basePreset;
  // Turnieje juniorskie bywają grane od stanu 2:2 w każdym secie.
  const preset = startAt22 ? { ...composed, setStartGames: 2 } : composed;
  const finalIsSuper = preset.finalSetSuperTiebreak;

  // null = jeszcze nie wybrano → apka zostaje neutralna, dopóki gracz nie
  // wskaże nawierzchni w zakładce "Gracze". Data meczu = dzisiejsza data z
  // systemu (bez ręcznego wyboru).
  const [surface, setSurface] = useState(null);

  const handleSurfaceChange = (val) => {
    setSurface(val);
    onSurfaceChange?.(val || null);
  };

  const [manualSets, setManualSets] = useState([{ a: "", b: "", tb: "", superTb: false }]);
  const [showDepthModal, setShowDepthModal] = useState(false);

  // Indeks graczy (wszystkie znane nazwiska + z kim kto grał) liczony raz z
  // historii meczów — ten sam pure-derive wzorzec co computeScore(), żadnego
  // osobnego stanu do synchronizowania.
  const playerIndex = useMemo(() => buildPlayerIndex(storage.listMatches()), []);
  const [favorites, setFavorites] = useState(() => getFavoritePlayers());
  const handleToggleFavorite = (name) => setFavorites(toggleFavoritePlayer(name));

  // Nazwisko zapisujemy w zapisie znanym z historii, więc "Kowalski Jan" i
  // "Jan Kowalski" to zawsze ten sam zawodnik (patrz nameKey.js).
  const nm = (v, fallback) => canonicalName(playerIndex, v) || fallback;
  const team1Names = () => [nm(t1a, tr("common.player1")), ...(isDoubles ? [nm(t1b, `${tr("common.player1")}b`)] : [])];
  const team2Names = () => [nm(t2a, tr("common.player2")), ...(isDoubles ? [nm(t2b, `${tr("common.player2")}b`)] : [])];

  const baseData = () => ({
    team1: { names: team1Names() },
    team2: { names: team2Names() },
    isDoubles,
    date: new Date().toISOString().slice(0, 10),
    surface: surface || "Twarda",
    teamTieId: tieContext?.tieId || null,
  });

  const linkToTie = (match) => {
    if (tieContext) addMatchToTie(tieContext.tieId, match.id);
    return match;
  };

  const handleTrackConfirm = (depthKey) => {
    const match = linkToTie(storage.createMatch({
      ...baseData(),
      rules: { ...preset },
      trackingDepth: depthKey,
      initialServer: null,
      status: "in_progress",
      pointLog: [],
    }));
    setShowDepthModal(false);
    onCreated(match);
  };

  const addManualSet = () => setManualSets((s) => (s.length >= 5 ? s : [...s, { a: "", b: "", tb: "", superTb: false }]));
  const removeManualSet = (i) => setManualSets((s) => s.filter((_, idx) => idx !== i));
  const updateManualSet = (i, patch) => setManualSets((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const handleSaveManual = () => {
    const finalSets = manualRowsToSets(manualSets);
    if (finalSets.length === 0) { alert(tr("setup.alertNeedOneSet")); return; }
    const match = linkToTie(storage.createMatch({
      ...baseData(),
      rules: null,
      trackingDepth: "basic",
      status: "completed",
      pointLog: [],
      finalSetsOverride: finalSets,
    }));
    onCreated(match);
  };

  return (
    <FullScreen>
      <TopBar title={isManual ? tr("setup.titleManual") : tr("setup.titleNew")} onBack={onCancel} />
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
        fontSize: 13, fontWeight: 600, color: surface ? t.accent : t.textMuted,
        flexShrink: 0,
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          background: surface ? themeForSurface(surface, palette).accent : t.textMuted,
          flexShrink: 0,
        }} />
        {surface ? tr("setup.surfaceLabel", { surface: surfaceLabel(lang, surface) }) : tr("setup.surfaceNotChosen")}
      </div>
      {tieContext && (
        <div style={{
          margin: "0 16px 4px", padding: "8px 14px", fontSize: 13, fontWeight: 600, color: t.accent,
          background: t.tonal, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon name="trophy" size={17} />{tr("tie.matchBanner", { team1: tieContext.team1Name, team2: tieContext.team2Name })}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, padding: "8px 16px", flexShrink: 0 }}>
        <TabBtn active={tab === "players"} onClick={() => setTab("players")}>{tr("setup.tabPlayers")}</TabBtn>
        {!isManual && <TabBtn active={tab === "rules"} onClick={() => setTab("rules")}>{tr("setup.tabRules")}</TabBtn>}
        {isManual && <TabBtn active={tab === "wynik"} onClick={() => setTab("wynik")}>{tr("setup.tabResult")}</TabBtn>}
      </div>
      <ScrollBody style={{ padding: 16 }}>
        {tab === "players" && (
          <>
            <span style={styles.label}>{tr("setup.surface")}</span>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {SURFACES.map((s) => (
                <SurfaceTile key={s} surface={s} active={surface === s} onClick={() => handleSurfaceChange(surface === s ? null : s)} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <Chip label={tr("setup.doubles")} active={isDoubles} onClick={() => setIsDoubles((v) => !v)} />
            </div>
            <datalist id="known-players">
              {playerIndex.allNames.map((n) => <option key={n} value={n} />)}
            </datalist>

            <NameField
              label={tieContext ? tr("tie.playerFor", { team: tieContext.team1Name }) : tr("setup.team1")} value={t1a} onChange={setT1a}
              favorites={favorites} onToggleFavorite={handleToggleFavorite}
              suggestions={suggestOpponents(playerIndex, t2a)}
              placeholder={tr("common.fullName")} listId="known-players"
            />
            {isDoubles && <input style={{ ...styles.input, marginBottom: 16 }} value={t1b} onChange={(e) => setT1b(e.target.value)} placeholder={tr("common.partner")} list="known-players" />}

            <NameField
              label={tieContext ? tr("tie.playerFor", { team: tieContext.team2Name }) : tr("setup.team2")} value={t2a} onChange={setT2a}
              favorites={favorites} onToggleFavorite={handleToggleFavorite}
              suggestions={suggestOpponents(playerIndex, t1a)}
              placeholder={tr("common.fullName")} listId="known-players"
            />
            {isDoubles && <input style={styles.input} value={t2b} onChange={(e) => setT2b(e.target.value)} placeholder={tr("common.partner")} list="known-players" />}
          </>
        )}

        {tab === "rules" && !isManual && (
          <>
            <span style={styles.label}>{tr("setup.rulesLabel")}</span>
            {Object.values(PRESETS).map((p) => (
              <RulesTile key={p.key} preset={p} active={p.key === presetKey} onClick={() => { setPresetKey(p.key); setFinalSetMode(null); }} />
            ))}
            <span style={styles.label}>{tr("setup.startLabel")}</span>
            <div style={{ display: "flex", gap: 4, padding: 3, background: t.tonal, borderRadius: 999, marginBottom: 16 }}>
              <TabBtn active={!startAt22} onClick={() => setStartAt22(false)}>{tr("setup.start00")}</TabBtn>
              <TabBtn active={startAt22} onClick={() => setStartAt22(true)}>{tr("setup.start22")}</TabBtn>
            </div>
            {basePreset.sets >= 3 && (
              <>
                <span style={styles.label}>{tr("setup.finalSetLabel")}</span>
                <div style={{ display: "flex", gap: 4, padding: 3, background: t.tonal, borderRadius: 999 }}>
                  <TabBtn active={!finalIsSuper} onClick={() => setFinalSetMode("full")}>{tr("setup.finalSetFull")}</TabBtn>
                  <TabBtn active={finalIsSuper} onClick={() => setFinalSetMode("super")}>{tr("setup.finalSetSuper")}</TabBtn>
                </div>
              </>
            )}
          </>
        )}

        {tab === "wynik" && isManual && (
          <>
            <div style={{ fontSize: 12, color: t.textSub, lineHeight: 1.45, marginBottom: 14 }}>{tr("setup.manualHint")}</div>
            {manualSets.map((row, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: t.textMuted, width: 40 }}>{row.superTb ? "STB" : tr("common.setLabel", { n: i + 1 })}</span>
                  <input style={{ ...styles.input, width: 56, textAlign: "center" }} type="number" inputMode="numeric" value={row.a} onChange={(e) => updateManualSet(i, { a: e.target.value })} placeholder={row.superTb ? "10" : "6"} />
                  <span>–</span>
                  <input style={{ ...styles.input, width: 56, textAlign: "center" }} type="number" inputMode="numeric" value={row.b} onChange={(e) => updateManualSet(i, { b: e.target.value })} placeholder={row.superTb ? "7" : "4"} />
                  {!row.superTb && (
                    <input style={{ ...styles.input, width: 56, textAlign: "center" }} type="number" inputMode="numeric" value={row.tb} onChange={(e) => updateManualSet(i, { tb: e.target.value })} placeholder={tr("setup.tbPlaceholder")} title={tr("setup.tbTitle")} />
                  )}
                  <button onClick={() => removeManualSet(i)} aria-label={tr("common.delete")} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", minWidth: 40, minHeight: 40, display: "grid", placeItems: "center" }}><Icon name="close" size={18} /></button>
                </div>
                {i >= 2 && (
                  <div style={{ marginTop: 8, marginLeft: 48 }}>
                    <Chip label={tr("setup.superTbRow")} active={row.superTb} onClick={() => updateManualSet(i, { superTb: !row.superTb, tb: "" })} />
                  </div>
                )}
              </div>
            ))}
            {manualSets.length < 5 && <button style={styles.secondaryBtn} onClick={addManualSet}><Icon name="add" size={18} />{tr("setup.addSet")}</button>}
          </>
        )}
      </ScrollBody>
      <div style={{ padding: "12px 16px calc(14px + env(safe-area-inset-bottom, 0px))", flexShrink: 0 }}>
        <button style={styles.primaryBtn} onClick={() => (isManual ? handleSaveManual() : setShowDepthModal(true))}>
          {isManual ? tr("setup.titleManual") : tr("setup.startTracking")}
        </button>
      </div>
      {showDepthModal && <DepthPickerModal onPick={handleTrackConfirm} onClose={() => setShowDepthModal(false)} />}
    </FullScreen>
  );
}
