// Tennis Tracker — statystyki zawodnika i pary zawodników (mecze, sety, gemy,
// punkty, break pointy) z wykresami i udostępnianiem.
import { useMemo, useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang, surfaceLabel } from "../i18n.js";
import { TopBar, FullScreen, ScrollBody, Card, ShareIcon, Icon } from "./ui.jsx";
import * as storage from "./storage.js";
import { listH2HPlayers, listH2HOpponents, computeH2H, computePlayerStats, pct, h2hText, normName } from "./h2h.js";
import { shareMatch, buildH2HShareUrl } from "./shareLink.js";
import { StatRow, Donut, FormStrip, MiniBar, sideColors } from "./charts.jsx";

const pctText = (w, tot) => { const p = pct(w, tot); return p == null ? "–" : `${p}% (${w}/${tot})`; };
const rate = (w, tot) => (tot ? w / tot : 0);

function Title({ children }) {
  const { t } = useThemeCtx();
  return <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{children}</div>;
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
        <StatRow label={tr("h2h.matches")} a={a.matchesWon} b={b.matchesWon} />
        <StatRow label={tr("h2h.sets")} a={a.setsWon} b={b.setsWon} />
        <StatRow label={tr("h2h.games")} a={a.gamesWon} b={b.gamesWon} />
        {detailed && (
          <>
            <StatRow label={tr("h2h.points")} a={a.pointsWon} b={b.pointsWon} />
            <StatRow label={tr("h2h.servePct")} a={rate(a.servePointsWon, a.servePointsTotal)} b={rate(b.servePointsWon, b.servePointsTotal)}
              aText={pctText(a.servePointsWon, a.servePointsTotal)} bText={pctText(b.servePointsWon, b.servePointsTotal)} />
            <StatRow label={tr("h2h.returnPct")} a={rate(a.returnPointsWon, a.returnPointsTotal)} b={rate(b.returnPointsWon, b.returnPointsTotal)}
              aText={pctText(a.returnPointsWon, a.returnPointsTotal)} bText={pctText(b.returnPointsWon, b.returnPointsTotal)} />
            <StatRow label={tr("h2h.bpConverted")} a={rate(a.bpConv, a.bpOpp)} b={rate(b.bpConv, b.bpOpp)}
              aText={`${a.bpConv}/${a.bpOpp}`} bText={`${b.bpConv}/${b.bpOpp}`} />
            <StatRow label={tr("h2h.bpSaved")} a={rate(b.bpOpp - b.bpConv, b.bpOpp)} b={rate(a.bpOpp - a.bpConv, a.bpOpp)}
              aText={`${b.bpOpp - b.bpConv}/${b.bpOpp}`} bText={`${a.bpOpp - a.bpConv}/${a.bpOpp}`} />
            <StatRow label={tr("stat.aces")} a={a.aces} b={b.aces} />
            <StatRow label={tr("stat.doubleFaults")} a={a.doubleFaults} b={b.doubleFaults} higherIsBetter={false} />
            <StatRow label={tr("stat.winners")} a={a.winners} b={b.winners} />
            <StatRow label={tr("stat.unforcedErrors")} a={a.unforcedErrors} b={b.unforcedErrors} higherIsBetter={false} />
          </>
        )}
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

export default function H2HPage({ initialA, initialB, onBack }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const matches = useMemo(() => storage.listMatches(), []);
  const players = useMemo(() => listH2HPlayers(matches), [matches]);
  const [mode, setMode] = useState(initialB ? "pair" : "player");
  const [nameA, setNameA] = useState(initialA || players[0]?.name || "");
  const rivals = useMemo(() => (nameA ? listH2HOpponents(matches, nameA) : []), [matches, nameA]);
  const [nameB, setNameB] = useState(initialB || "");
  const effectiveB = rivals.some((r) => r.key === normName(nameB)) ? nameB : (rivals[0]?.name || "");

  const pair = useMemo(() => (mode === "pair" && nameA && effectiveB ? computeH2H(matches, nameA, effectiveB) : null), [mode, matches, nameA, effectiveB]);
  const player = useMemo(() => (mode === "player" && nameA ? computePlayerStats(matches, nameA) : null), [mode, matches, nameA]);
  const h = pair || player;

  const select = { ...styles.input, appearance: "auto", marginBottom: 12, cursor: "pointer" };
  const labels = { matches: tr("h2h.matches"), sets: tr("h2h.sets"), games: tr("h2h.games"), points: tr("h2h.points") };
  const shareName = pair ? undefined : tr("h2h.allOpponents");
  const shareData = h && (pair ? h : { ...h, nameA: h.name, nameB: shareName });
  const onShareLink = () => shareMatch(h2hText(shareData, labels), buildH2HShareUrl(shareData));
  const onShareText = () => shareMatch(h2hText(shareData, labels), null);
  const btn = { ...styles.secondaryBtn, flex: 1, minWidth: 0, fontSize: 14 };

  return (
    <FullScreen>
      <TopBar title={tr("h2h.title")} onBack={onBack} />
      <ScrollBody style={{ padding: 16 }}>
        {players.length === 0 ? (
          <div style={styles.centered}><span style={{ maxWidth: 280 }}>{tr("h2h.empty")}</span></div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, padding: 3, background: t.tonal, borderRadius: 999, marginBottom: 14 }}>
              <TabBtn t={t} active={mode === "player"} onClick={() => setMode("player")}>{tr("h2h.modePlayer")}</TabBtn>
              <TabBtn t={t} active={mode === "pair"} onClick={() => setMode("pair")}>{tr("h2h.modePair")}</TabBtn>
            </div>
            <span style={styles.label}>{tr("h2h.player")}</span>
            <select style={select} value={nameA} onChange={(e) => { setNameA(e.target.value); setNameB(""); }}>
              {players.map((p) => <option key={p.key} value={p.name}>{p.name}</option>)}
            </select>
            {mode === "pair" && (
              <>
                <span style={styles.label}>{tr("h2h.rival")}</span>
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
                      <button key={o.key} onClick={() => { setNameB(o.name); setMode("pair"); }} style={{
                        display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 8,
                        padding: "10px 14px", border: "none", borderTop: `1px solid ${t.border}`, background: "transparent",
                        color: t.text, fontFamily: "inherit", fontSize: 14, cursor: "pointer", textAlign: "left",
                      }}>
                        <span style={{ fontWeight: 650 }}>{o.name}</span>
                        <span style={{ color: t.textSub, fontFamily: t.fontScore, fontSize: 16 }}>{o.won}–{o.lost} ({o.played})</span>
                      </button>
                    ))}
                  </Card>
                )}
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
