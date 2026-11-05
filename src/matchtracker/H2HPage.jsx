// Tennis Tracker — statystyki zawodnika i pary (single i debel): mecze, sety,
// gemy, punkty, break pointy, z wykresami i udostępnianiem (link, tekst, obraz).
import { useMemo, useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang, surfaceLabel } from "../i18n.js";
import { TopBar, FullScreen, ScrollBody, Card, ShareIcon, Icon } from "./ui.jsx";
import * as storage from "./storage.js";
import {
  listH2HPlayers, listH2HOpponents, listH2HTeams, listH2HTeamOpponents,
  computeH2H, computePlayerStats, pct, h2hText, normName, teamKey,
} from "./h2h.js";
import { shareMatch, buildH2HShareUrl } from "./shareLink.js";
import { renderStatsPng, shareStatsPng } from "./statsImage.js";
import { StatRow, Donut, FormStrip, MiniBar, sideColors } from "./charts.jsx";

const pctText = (w, tot) => { const p = pct(w, tot); return p == null ? "–" : `${p}% (${w}/${tot})`; };
const rate = (w, tot) => (tot ? w / tot : 0);

function Title({ children }) {
  const { t } = useThemeCtx();
  return <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{children}</div>;
}

// Wiersze porównania (te same na ekranie i na obrazie do wysłania).
export function h2hRows(h, tr) {
  const { a, b } = h;
  const rows = [
    { label: tr("h2h.matches"), a: a.matchesWon, b: b.matchesWon },
    { label: tr("h2h.sets"), a: a.setsWon, b: b.setsWon },
    { label: tr("h2h.games"), a: a.gamesWon, b: b.gamesWon },
  ];
  if (h.detailedMatches > 0) {
    rows.push(
      { label: tr("h2h.points"), a: a.pointsWon, b: b.pointsWon },
      { label: tr("h2h.servePct"), a: rate(a.servePointsWon, a.servePointsTotal), b: rate(b.servePointsWon, b.servePointsTotal),
        aText: pctText(a.servePointsWon, a.servePointsTotal), bText: pctText(b.servePointsWon, b.servePointsTotal) },
      { label: tr("h2h.returnPct"), a: rate(a.returnPointsWon, a.returnPointsTotal), b: rate(b.returnPointsWon, b.returnPointsTotal),
        aText: pctText(a.returnPointsWon, a.returnPointsTotal), bText: pctText(b.returnPointsWon, b.returnPointsTotal) },
      { label: tr("h2h.bpConverted"), a: rate(a.bpConv, a.bpOpp), b: rate(b.bpConv, b.bpOpp), aText: `${a.bpConv}/${a.bpOpp}`, bText: `${b.bpConv}/${b.bpOpp}` },
      { label: tr("h2h.bpSaved"), a: rate(b.bpOpp - b.bpConv, b.bpOpp), b: rate(a.bpOpp - a.bpConv, a.bpOpp),
        aText: `${b.bpOpp - b.bpConv}/${b.bpOpp}`, bText: `${a.bpOpp - a.bpConv}/${a.bpOpp}` },
      { label: tr("stat.aces"), a: a.aces, b: b.aces },
      { label: tr("stat.doubleFaults"), a: a.doubleFaults, b: b.doubleFaults, higherIsBetter: false },
      { label: tr("stat.winners"), a: a.winners, b: b.winners },
      { label: tr("stat.unforcedErrors"), a: a.unforcedErrors, b: b.unforcedErrors, higherIsBetter: false },
    );
  }
  return rows;
}

// Wspólny blok statystyk: `h` z computeH2H albo computePlayerStats, `nameA` i
// `nameB` to podpisy stron.
function StatsBlock({ h, nameA, nameB, playerMode }) {
  const { t } = useThemeCtx();
  const { lang, t: tr } = useLang();
  const c = sideColors(t);
  const { a, b } = h;
  const detailed = h.detailedMatches > 0;
  const surfaces = Object.entries(h.bySurface);
  const form = h.list.slice(-10).map((m) => ({ win: m.winner === "a" ? true : m.winner === "b" ? false : null, title: `${m.date} ${m.opponent}` }));

  return (
    <>
      <Card>
        <div style={{ padding: 16, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, gap: 8 }}>
            <span style={{ flex: 1, textAlign: "left", color: c.a }}>{nameA}</span>
            <span style={{ flex: 1, textAlign: "right", color: c.b }}>{nameB}</span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, fontFamily: t.fontScore, marginTop: 6 }}>
            <span style={{ color: c.a }}>{a.matchesWon}</span> : <span style={{ color: c.b }}>{b.matchesWon}</span>
          </div>
          <div style={{ fontSize: 12, color: t.textSub }}>{tr("h2h.playedN", { n: h.total })}</div>
          {h.streak.who && h.streak.count > 1 && (
            <div style={{ fontSize: 12, color: t.textSub, marginTop: 4 }}>
              {tr("h2h.streak", { name: h.streak.who === "a" ? nameA : nameB, n: h.streak.count })}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Donut size={72} a={a.matchesWon} b={b.matchesWon} label={tr("h2h.matches")} />
            <Donut size={72} a={a.setsWon} b={b.setsWon} label={tr("h2h.sets")} />
            <Donut size={72} a={a.gamesWon} b={b.gamesWon} label={tr("h2h.games")} />
            {detailed && <Donut size={72} a={a.pointsWon} b={b.pointsWon} label={tr("h2h.points")} />}
          </div>
        </div>
      </Card>

      <Card>
        {h2hRows(h, tr).map((r) => <StatRow key={r.label} {...r} />)}
        <div style={{ padding: "8px 14px", borderTop: `1px solid ${t.border}`, fontSize: 12, color: t.textSub }}>
          {detailed ? tr("h2h.pointsNote", { n: h.detailedMatches, total: h.total }) : tr("h2h.noPoints")}
        </div>
      </Card>

      {form.length > 1 && (
        <Card>
          <Title>{tr("h2h.form")}</Title>
          <FormStrip results={form} />
        </Card>
      )}

      {surfaces.length > 0 && (
        <Card>
          <Title>{tr("h2h.surfaces")}</Title>
          {surfaces.map(([sf, v]) => (
            <StatRow key={sf} label={sf === "—" ? "—" : surfaceLabel(lang, sf)} a={v.a} b={v.b} />
          ))}
        </Card>
      )}

      <Card>
        <Title>{tr("h2h.history")}</Title>
        {[...h.list].reverse().map((m) => (
          <div key={m.id} style={{ padding: "8px 14px", borderTop: `1px solid ${t.border}`, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ color: t.textSub, flexShrink: 0 }}>{m.date}{m.surface ? ` · ${surfaceLabel(lang, m.surface)}` : ""}</span>
              <span style={{ fontFamily: t.fontScore, fontSize: 16, fontWeight: 700, color: t.text, textAlign: "right" }}>{m.sets.join("  ")}</span>
              <span style={{ maxWidth: 110, minWidth: 60, textAlign: "right", fontSize: 11, fontWeight: 700, color: m.winner === "a" ? c.a : c.b, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.winner === "a" ? nameA : m.winner === "b" ? (playerMode ? m.opponent : nameB) : ""}
              </span>
            </div>
            <MiniBar a={m.games[0]} b={m.games[1]} />
          </div>
        ))}
      </Card>
    </>
  );
}

function TabBtn({ active, onClick, children, t }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      flex: 1, minHeight: 40, padding: "8px 6px", border: "none", borderRadius: 999,
      background: active ? t.tonalStrong : "transparent", color: active ? t.text : t.textSub,
      fontWeight: active ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
    }}>{children}</button>
  );
}

export default function H2HPage({ initialA, initialB, initialDoubles, onBack }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const matches = useMemo(() => storage.listMatches(), []);
  const [kind, setKind] = useState(initialDoubles ? "doubles" : "singles");
  const [mode, setMode] = useState(initialB ? "pair" : "player");
  const [nameA, setNameA] = useState(initialA || "");
  const [nameB, setNameB] = useState(initialB || "");
  const [note, setNote] = useState("");

  // Lista wyboru: single i debel w trybie "zawodnik" to pojedyncze osoby, a debel w trybie "para" to pary.
  const teamsMode = kind === "doubles" && mode === "pair";
  const keyOf = (name) => (teamsMode ? teamKey(String(name).split(" / ")) : normName(name));
  const options = useMemo(
    () => (teamsMode ? listH2HTeams(matches) : listH2HPlayers(matches, kind)),
    [matches, kind, teamsMode],
  );
  const effectiveA = options.some((o) => o.key === keyOf(nameA)) ? nameA : (options[0]?.name || "");
  const rivals = useMemo(() => {
    if (!effectiveA || mode !== "pair") return [];
    return teamsMode ? listH2HTeamOpponents(matches, effectiveA) : listH2HOpponents(matches, effectiveA, kind);
  }, [matches, effectiveA, mode, kind, teamsMode]);
  const effectiveB = rivals.some((r) => r.key === keyOf(nameB)) ? nameB : (rivals[0]?.name || "");

  const pair = useMemo(() => (mode === "pair" && effectiveA && effectiveB ? computeH2H(matches, effectiveA, effectiveB, kind) : null), [mode, matches, effectiveA, effectiveB, kind]);
  const player = useMemo(() => (mode === "player" && effectiveA ? computePlayerStats(matches, effectiveA, kind) : null), [mode, matches, effectiveA, kind]);
  const h = pair || player;
  const hasAny = listH2HPlayers(matches, "singles").length + listH2HPlayers(matches, "doubles").length > 0;

  const select = { ...styles.input, appearance: "auto", marginBottom: 12, cursor: "pointer" };
  const labels = { matches: tr("h2h.matches"), sets: tr("h2h.sets"), games: tr("h2h.games"), points: tr("h2h.points") };
  const shareData = h && (pair ? h : { ...h, nameA: h.name, nameB: tr("h2h.allOpponents") });
  const onShareLink = () => shareMatch(h2hText(shareData, labels), buildH2HShareUrl(shareData));
  const onShareText = () => shareMatch(h2hText(shareData, labels), null);
  const onShareImage = async () => {
    const png = renderStatsPng({
      title: tr("h2h.title"), nameA: shareData.nameA, nameB: shareData.nameB,
      scoreA: h.a.matchesWon, scoreB: h.b.matchesWon, subtitle: tr("h2h.playedN", { n: h.total }),
      rows: h2hRows(h, tr),
    }, t);
    const r = await shareStatsPng(png, "tennis-tracker-statystyki.png", `${shareData.nameA} – ${shareData.nameB}`);
    setNote(r === "downloaded" ? tr("h2h.imageSaved") : r === "failed" ? tr("h2h.imageError") : "");
  };
  const btn = { ...styles.secondaryBtn, flex: 1, minWidth: 0, fontSize: 13, padding: "0 6px" };
  const opponentsClickable = kind === "singles";
  const switchKind = (k) => { setKind(k); setNameA(""); setNameB(""); setNote(""); };
  const switchMode = (m) => { setMode(m); setNameA(""); setNameB(""); setNote(""); };

  return (
    <FullScreen>
      <TopBar title={tr("h2h.title")} onBack={onBack} />
      <ScrollBody style={{ padding: 16 }}>
        {!hasAny ? (
          <div style={styles.centered}><span style={{ maxWidth: 280 }}>{tr("h2h.empty")}</span></div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, padding: 3, background: t.tonal, borderRadius: 999, marginBottom: 10 }}>
              <TabBtn t={t} active={kind === "singles"} onClick={() => switchKind("singles")}>{tr("h2h.kindSingles")}</TabBtn>
              <TabBtn t={t} active={kind === "doubles"} onClick={() => switchKind("doubles")}>{tr("h2h.kindDoubles")}</TabBtn>
            </div>
            <div style={{ display: "flex", gap: 4, padding: 3, background: t.tonal, borderRadius: 999, marginBottom: 14 }}>
              <TabBtn t={t} active={mode === "player"} onClick={() => switchMode("player")}>{tr("h2h.modePlayer")}</TabBtn>
              <TabBtn t={t} active={mode === "pair"} onClick={() => switchMode("pair")}>{tr(kind === "doubles" ? "h2h.modeTeams" : "h2h.modePair")}</TabBtn>
            </div>
            {options.length === 0 ? (
              <div style={styles.centered}><span style={{ maxWidth: 280 }}>{tr("h2h.emptyKind")}</span></div>
            ) : (
              <>
                <span style={styles.label}>{tr(teamsMode ? "h2h.team" : "h2h.player")}</span>
                <select style={select} value={effectiveA} onChange={(e) => { setNameA(e.target.value); setNameB(""); }}>
                  {options.map((p) => <option key={p.key} value={p.name}>{p.name}</option>)}
                </select>
                {mode === "pair" && (
                  <>
                    <span style={styles.label}>{tr(teamsMode ? "h2h.rivalTeam" : "h2h.rival")}</span>
                    <select style={select} value={effectiveB} onChange={(e) => setNameB(e.target.value)}>
                      {rivals.length === 0 && <option value="">{tr("h2h.pickRival")}</option>}
                      {rivals.map((r) => <option key={r.key} value={r.name}>{r.name} ({r.count})</option>)}
                    </select>
                  </>
                )}

                {h && h.total > 0 && (
                  <>
                    <StatsBlock playerMode={!pair} h={h} nameA={pair ? h.nameA : h.name} nameB={pair ? h.nameB : tr("h2h.allOpponents")} />
                    {player && player.opponents.length > 0 && (
                      <Card>
                        <Title>{tr("h2h.opponentsTitle")}</Title>
                        {player.opponents.map((o) => (
                          <button key={o.key} disabled={!opponentsClickable}
                            onClick={() => { if (opponentsClickable) { setNameA(h.name); setNameB(o.name); setMode("pair"); } }} style={{
                              display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 8,
                              padding: "10px 14px", border: "none", borderTop: `1px solid ${t.border}`, background: "transparent",
                              color: t.text, fontFamily: "inherit", fontSize: 14, cursor: opponentsClickable ? "pointer" : "default", textAlign: "left",
                            }}>
                            <span style={{ fontWeight: 650 }}>{o.name}</span>
                            <span style={{ color: t.textSub, fontFamily: t.fontScore, fontSize: 16 }}>{o.won}–{o.lost} ({o.played})</span>
                          </button>
                        ))}
                      </Card>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button style={btn} onClick={onShareImage}><Icon name="image" size={18} />{tr("h2h.shareImage")}</button>
                      <button style={btn} onClick={onShareLink}><ShareIcon size={18} />{tr("h2h.shareLink")}</button>
                      <button style={btn} onClick={onShareText}><Icon name="edit" size={18} />{tr("h2h.shareText")}</button>
                    </div>
                    {note && <div style={{ fontSize: 12, color: t.textSub, textAlign: "center", marginTop: 8 }}>{note}</div>}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollBody>
    </FullScreen>
  );
}
