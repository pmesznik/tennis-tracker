// Tennis Tracker — statystyki łączne z rywalem (mecze, sety, gemy, punkty).
import { useMemo, useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang, surfaceLabel } from "../i18n.js";
import { TopBar, FullScreen, ScrollBody, Card, ShareIcon, Icon } from "./ui.jsx";
import * as storage from "./storage.js";
import { listH2HPlayers, listH2HOpponents, computeH2H, pct, h2hText, normName } from "./h2h.js";
import { shareMatch, buildH2HShareUrl } from "./shareLink.js";

function Row({ label, left, right, t, strongLeft, strongRight }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "8px 14px", borderTop: `1px solid ${t.border}` }}>
      <span style={{ flex: 1, fontWeight: strongLeft ? 800 : 600, color: strongLeft ? t.accent : t.text, fontFamily: t.fontScore, fontSize: 18 }}>{left}</span>
      <span style={{ width: 130, textAlign: "center", fontSize: 11, color: t.textMuted, textTransform: "uppercase" }}>{label}</span>
      <span style={{ flex: 1, textAlign: "right", fontWeight: strongRight ? 800 : 600, color: strongRight ? t.accent : t.text, fontFamily: t.fontScore, fontSize: 18 }}>{right}</span>
    </div>
  );
}

const cmp = (x, y) => [x > y, y > x];
const pctText = (w, tot) => { const p = pct(w, tot); return p == null ? "–" : `${p}% (${w}/${tot})`; };

export default function H2HPage({ initialA, initialB, onBack }) {
  const { t, styles } = useThemeCtx();
  const { lang, t: tr } = useLang();
  const matches = useMemo(() => storage.listMatches(), []);
  const players = useMemo(() => listH2HPlayers(matches), [matches]);
  const [nameA, setNameA] = useState(initialA || players[0]?.name || "");
  const rivals = useMemo(() => (nameA ? listH2HOpponents(matches, nameA) : []), [matches, nameA]);
  const [nameB, setNameB] = useState(() => {
    if (initialB) return initialB;
    return "";
  });
  const effectiveB = rivals.some((r) => r.key === normName(nameB)) ? nameB : (rivals[0]?.name || "");
  const h = useMemo(() => (nameA && effectiveB ? computeH2H(matches, nameA, effectiveB) : null), [matches, nameA, effectiveB]);

  const select = {
    ...styles.input, appearance: "auto", marginBottom: 12, cursor: "pointer",
  };

  const labels = { matches: tr("h2h.matches"), sets: tr("h2h.sets"), games: tr("h2h.games"), points: tr("h2h.points") };
  const onShareLink = () => shareMatch(h2hText(h, labels), buildH2HShareUrl(h));
  const onShareText = () => shareMatch(h2hText(h, labels), null);

  const streakName = h && h.streak.who ? (h.streak.who === "a" ? h.nameA : h.nameB) : null;
  const surfaces = h ? Object.entries(h.bySurface) : [];
  const btn = { ...styles.secondaryBtn, flex: 1, minWidth: 0, fontSize: 14 };

  return (
    <FullScreen>
      <TopBar title={tr("h2h.title")} onBack={onBack} />
      <ScrollBody style={{ padding: 16 }}>
        {players.length === 0 ? (
          <div style={styles.centered}><span style={{ maxWidth: 280 }}>{tr("h2h.empty")}</span></div>
        ) : (
          <>
            <span style={styles.label}>{tr("h2h.player")}</span>
            <select style={select} value={nameA} onChange={(e) => { setNameA(e.target.value); setNameB(""); }}>
              {players.map((p) => <option key={p.key} value={p.name}>{p.name}</option>)}
            </select>
            <span style={styles.label}>{tr("h2h.rival")}</span>
            <select style={select} value={effectiveB} onChange={(e) => setNameB(e.target.value)}>
              {rivals.length === 0 && <option value="">{tr("h2h.pickRival")}</option>}
              {rivals.map((r) => <option key={r.key} value={r.name}>{r.name} ({r.count})</option>)}
            </select>

            {h && h.total > 0 && (
              <>
                <Card>
                  <div style={{ padding: 16, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
                      <span style={{ flex: 1, textAlign: "left" }}>{h.nameA}</span>
                      <span style={{ flex: 1, textAlign: "right" }}>{h.nameB}</span>
                    </div>
                    <div style={{ fontSize: 44, fontWeight: 700, color: t.accent, fontFamily: t.fontScore, marginTop: 6 }}>
                      {h.a.matchesWon} : {h.b.matchesWon}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSub }}>{tr("h2h.playedN", { n: h.total })}</div>
                    {streakName && h.streak.count > 1 && (
                      <div style={{ fontSize: 12, color: t.textSub, marginTop: 4 }}>{tr("h2h.streak", { name: streakName, n: h.streak.count })}</div>
                    )}
                  </div>
                </Card>

                <Card>
                  <Row t={t} label={tr("h2h.matches")} left={h.a.matchesWon} right={h.b.matchesWon} strongLeft={cmp(h.a.matchesWon, h.b.matchesWon)[0]} strongRight={cmp(h.a.matchesWon, h.b.matchesWon)[1]} />
                  <Row t={t} label={tr("h2h.sets")} left={h.a.setsWon} right={h.b.setsWon} strongLeft={cmp(h.a.setsWon, h.b.setsWon)[0]} strongRight={cmp(h.a.setsWon, h.b.setsWon)[1]} />
                  <Row t={t} label={tr("h2h.games")} left={h.a.gamesWon} right={h.b.gamesWon} strongLeft={cmp(h.a.gamesWon, h.b.gamesWon)[0]} strongRight={cmp(h.a.gamesWon, h.b.gamesWon)[1]} />
                  {h.detailedMatches > 0 && (
                    <>
                      <Row t={t} label={tr("h2h.points")} left={h.a.pointsWon} right={h.b.pointsWon} strongLeft={cmp(h.a.pointsWon, h.b.pointsWon)[0]} strongRight={cmp(h.a.pointsWon, h.b.pointsWon)[1]} />
                      <Row t={t} label={tr("h2h.servePct")} left={pctText(h.a.servePointsWon, h.a.servePointsTotal)} right={pctText(h.b.servePointsWon, h.b.servePointsTotal)} />
                      <Row t={t} label={tr("h2h.returnPct")} left={pctText(h.a.returnPointsWon, h.a.returnPointsTotal)} right={pctText(h.b.returnPointsWon, h.b.returnPointsTotal)} />
                      <Row t={t} label={tr("stat.aces")} left={h.a.aces} right={h.b.aces} />
                      <Row t={t} label={tr("stat.doubleFaults")} left={h.a.doubleFaults} right={h.b.doubleFaults} />
                      <Row t={t} label={tr("stat.winners")} left={h.a.winners} right={h.b.winners} />
                      <Row t={t} label={tr("stat.unforcedErrors")} left={h.a.unforcedErrors} right={h.b.unforcedErrors} />
                    </>
                  )}
                  <div style={{ padding: "8px 14px", borderTop: `1px solid ${t.border}`, fontSize: 12, color: t.textSub }}>
                    {h.detailedMatches > 0 ? tr("h2h.pointsNote", { n: h.detailedMatches, total: h.total }) : tr("h2h.noPoints")}
                  </div>
                </Card>

                {surfaces.length > 0 && (
                  <Card>
                    <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("h2h.surfaces")}</div>
                    {surfaces.map(([sf, v]) => (
                      <Row key={sf} t={t} label={sf === "—" ? "—" : surfaceLabel(lang, sf)} left={v.a} right={v.b} />
                    ))}
                  </Card>
                )}

                <Card>
                  <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("h2h.history")}</div>
                  {[...h.list].reverse().map((m) => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 14px", borderTop: `1px solid ${t.border}`, fontSize: 13 }}>
                      <span style={{ color: t.textSub, flexShrink: 0 }}>{m.date}{m.surface ? ` · ${surfaceLabel(lang, m.surface)}` : ""}</span>
                      <span style={{ fontFamily: t.fontScore, fontSize: 16, fontWeight: 700, color: t.text, textAlign: "right" }}>{m.sets.join("  ")}</span>
                      <span style={{ width: 70, textAlign: "right", fontSize: 11, fontWeight: 700, color: t.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.winner === "a" ? h.nameA : m.winner === "b" ? h.nameB : ""}
                      </span>
                    </div>
                  ))}
                </Card>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button style={btn} onClick={onShareLink}><ShareIcon size={19} />{tr("h2h.shareLink")}</button>
                  <button style={btn} onClick={onShareText}><Icon name="edit" size={19} />{tr("h2h.shareText")}</button>
                </div>
              </>
            )}
          </>
        )}
      </ScrollBody>
    </FullScreen>
  );
}
