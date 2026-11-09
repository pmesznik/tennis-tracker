// Tennis Tracker v0.2.0 — podsumowanie meczu (wynik + statystyki).
import { useEffect, useMemo, useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang, surfaceLabel } from "../i18n.js";
import { TopBar, FullScreen, ScrollBody, Card, ShareIcon, Icon } from "./ui.jsx";
import * as storage from "./storage.js";
import { computeScore, formatSetsString, buildSetRow, teamLabel, TEAM1, TEAM2 } from "./scoringEngine.js";
import { shareMatch, buildShareUrl, buildProShareUrl } from "./shareLink.js";
import { clearLiveScore } from "./liveSync.js";
import { removeMatchFromTie } from "./teamTies.js";
import { formatDuration, longestPoint, averagePointDurationMs } from "./time.js";
import { computeStats, computeBreakPoints, flowSeries } from "./stats.js";
import { StatRow, Donut, FlowChart, PointsChart, GamesStrip, SetPointsBars, GameFlow, sideColors } from "./charts.jsx";
import { buildTimeline } from "./timeline.js";
import { computeMomentum } from "./momentum.js";
import { buildGames } from "./gameFlow.js";
import { renderMatchPdf, shareMatchPdf } from "./matchPdf.js";
import { earlyResult } from "./earlyEnd.js";
import appIcon from "../assets/app-icon.svg";
import { renderStatsPng, shareStatsPng } from "./statsImage.js";
import { earlySetsRow } from "./earlyEnd.js";
import { EditNamesModal, EditScoreModal } from "./TrackerModals.jsx";
import { buildRenamePatch, manualRowsToSets, setsToManualRows, validateManualRows } from "./matchEdit.js";

const STAT_ROWS = [
  ["aces", "stat.aces"],
  ["doubleFaults", "stat.doubleFaults"],
  ["winners", "stat.winners"],
  ["forcedErrors", "stat.forcedErrors"],
  ["unforcedErrors", "stat.unforcedErrors"],
  ["netPoints", "stat.netPoints"],
];

export default function MatchSummaryPage({ matchId, onBack, onContinue, onDeleted, onSurfaceChange, onOpenH2H }) {
  const { t, styles } = useThemeCtx();
  const { lang, t: tr } = useLang();
  const [, setTick] = useState(0);
  const [editNames, setEditNames] = useState(false);
  const [editScore, setEditScore] = useState(false);
  const match = storage.getMatch(matchId);
  // Oś czasu (punkty narastająco) liczona raz na zmianę zapisu punktów.
  const timeline = useMemo(() => (match && match.rules && (match.pointLog || []).length >= 2 ? buildTimeline(match) : null), [match?.id, match?.pointLog?.length, match?.updatedAt]);

  useEffect(() => {
    onSurfaceChange?.(match?.surface || null);
  }, [match?.surface]);

  if (!match) return <FullScreen><TopBar title={tr("common.matchNotFound")} onBack={onBack} /></FullScreen>;

  const name1 = teamLabel(TEAM1, match.team1.names, match.team2.names, tr("common.player1"), tr("common.player2"));
  const name2 = teamLabel(TEAM2, match.team1.names, match.team2.names, tr("common.player1"), tr("common.player2"));

  let setsRow;
  let score = null;
  if (match.endReason) {
    setsRow = earlySetsRow(match);
    score = match.rules ? computeScore(match.rules, match.pointLog, match.initialServer || TEAM1, match.startedAt) : null;
  } else if (match.status === "completed" && match.finalSetsOverride) {
    setsRow = match.finalSetsOverride.map((s) => formatSetsString([s]));
  } else {
    score = computeScore(match.rules, match.pointLog, match.initialServer || TEAM1, match.startedAt);
    setsRow = match.status === "completed" ? score.sets.map((s) => formatSetsString([s])) : buildSetRow(match.rules, score);
  }

  const gameList = useMemo(() => (timeline ? buildGames(match, timeline) : []), [timeline]);
  const momentum = useMemo(() => (timeline ? computeMomentum(match, timeline) : null), [timeline]);
  const hasPointDetail = match.trackingDepth !== "basic" && match.pointLog.length > 0;
  const { stats, avgRally } = hasPointDetail ? computeStats(match.pointLog) : { stats: null, avgRally: null };
  const bp = hasPointDetail ? computeBreakPoints(match.rules, match.pointLog, match.initialServer || TEAM1) : null;
  const ptsA = match.pointLog.filter((p) => p.winner === TEAM1).length;
  const ptsB = match.pointLog.length - ptsA;
  const colors = sideColors(t);

  // Brak czasu dla ręcznie wpisanych wyników (finalSetsOverride) — nie ma tam
  // żadnych znaczników czasu do policzenia.
  const hasTiming = !match.finalSetsOverride && match.startedAt != null;
  const totalDurationMs = hasTiming ? (match.endedAt ?? Date.now()) - match.startedAt : null;
  const longest = hasTiming ? longestPoint(match.pointLog, match.startedAt) : null;
  const avgPointMs = hasTiming ? averagePointDurationMs(match.pointLog, match.startedAt) : null;

  const handleShareImage = () => {
    const rows = [{ label: tr("summary.pointsShare"), a: ptsA, b: ptsB }];
    if (bp) rows.push({ label: tr("summary.bpConverted"), a: bp.team1.opp ? bp.team1.conv / bp.team1.opp : 0, b: bp.team2.opp ? bp.team2.conv / bp.team2.opp : 0, aText: `${bp.team1.conv}/${bp.team1.opp}`, bText: `${bp.team2.conv}/${bp.team2.opp}` });
    for (const [key, labelKey] of STAT_ROWS) rows.push({ label: tr(labelKey), a: stats.team1[key], b: stats.team2[key], higherIsBetter: key !== "doubleFaults" && key !== "unforcedErrors" });
    const png = renderStatsPng({ title: tr("summary.title"), nameA: name1, nameB: name2, scoreA: score ? score.setsWonA : 0, scoreB: score ? score.setsWonB : 0, subtitle: setsRow.join("  "), rows }, t);
    shareStatsPng(png, "tennis-tracker-mecz.png", `${name1} – ${name2}: ${setsRow.join(" ")}`);
  };

  // PDF z podsumowaniem: wynik, wykresy punktów, gemy po kolei i statystyki.
  // Mecz bez zapisu punktów (wynik wpisany ręcznie) dostaje sam wynik w setach.
  const handlePdf = async () => {
    const setsList = match.endReason ? earlyResult(match).sets
      : match.finalSetsOverride ? match.finalSetsOverride
      : (score ? score.sets : []);
    const winnerSide = match.endReason ? (match.resultWinner === TEAM1 ? "a" : "b")
      : score?.matchWinner ? (score.matchWinner === TEAM1 ? "a" : "b")
      : null;
    const serveOf = (team) => {
      const own = match.pointLog.filter((p) => p.server === team);
      return own.length ? `${Math.round((own.filter((p) => p.winner === team).length / own.length) * 100)}%` : null;
    };
    const rows = [];
    if (match.pointLog.length) {
      rows.push({ label: tr("summary.pointsShare"), a: ptsA, b: ptsB });
      const sa = serveOf(TEAM1), sb = serveOf(TEAM2);
      if (sa && sb) rows.push({ label: tr("pdf.servePoints"), a: sa, b: sb });
    }
    if (hasPointDetail && stats) {
      if (bp) rows.push({ label: tr("summary.bpConverted"), a: `${bp.team1.conv}/${bp.team1.opp}`, b: `${bp.team2.conv}/${bp.team2.opp}` });
      for (const [key, labelKey] of STAT_ROWS) rows.push({ label: tr(labelKey), a: stats.team1[key], b: stats.team2[key] });
    }
    if (momentum) {
      rows.push({ label: tr("summary.pointStreak"), a: momentum.pointStreak.a, b: momentum.pointStreak.b });
      if (momentum.gameStreak) rows.push({ label: tr("summary.gameStreak"), a: momentum.gameStreak.a, b: momentum.gameStreak.b });
      if (hasPointDetail && bp && (bp.team1.opp > 0 || bp.team2.opp > 0)) {
        rows.push({ label: tr("summary.bpSavedRow"), a: `${bp.team2.opp - bp.team2.conv}/${bp.team2.opp}`, b: `${bp.team1.opp - bp.team1.conv}/${bp.team1.opp}` });
      }
    }
    const extraLines = [
      avgRally != null ? `${tr("summary.avgRallyLabel")} ${avgRally} ${tr("summary.hitsUnit")}` : null,
      momentum?.longestGame ? tr("summary.longestGame", { n: momentum.longestGame.points, set: momentum.longestGame.set, game: momentum.longestGame.game, name: momentum.longestGame.winner === TEAM1 ? name1 : name2 }) : null,
    ].filter(Boolean);
    const headline = [match.date, match.surface ? surfaceLabel(lang, match.surface) : null, hasTiming ? formatDuration(totalDurationMs) : null].filter(Boolean).join(" · ");
    const pdf = await renderMatchPdf({
      L: {
        title: tr("summary.title"), vs: tr("common.vs"), setN: tr("summary.setN", { n: "{n}" }),
        pointsTitle: tr("summary.pointsChartTitle"), pointsHint: tr("pdf.pointsHint"),
        flowTitle: tr("summary.flowTitle"), flowHint: tr("pdf.flowHint"), gamesTitle: tr("pdf.gamesTitle"),
        footer: tr("pdf.footer"), pageOf: tr("pdf.pageOf", { n: "{n}", m: "{m}" }),
      },
      nameA: name1, nameB: name2, shortA: name1.split(" ")[0], shortB: name2.split(" ")[0],
      headline, sets: setsList, winner: winnerSide,
      note: match.endReason ? tr("summary.endedEarly", { reason: tr(`tracker.reason.${match.endReason}`), winner: match.resultWinner === TEAM1 ? name1 : name2 }) : "",
      timeline, rows,
      extra: extraLines,
      logoUrl: appIcon,
    });
    const slug = `${name1}-${name2}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    shareMatchPdf(pdf, `tennis-tracker-${slug}-${match.date}.pdf`, `${name1} – ${name2}: ${setsRow.join(" ")}`);
  };

  const handleSaveNames = (n1, n2) => {
    storage.updateMatch(match.id, buildRenamePatch(match, n1, n2, storage.listMatches().filter((m) => m.id !== match.id), tr("common.player1"), tr("common.player2")));
    setEditNames(false);
    setTick((x) => x + 1);
  };
  const handleSaveScore = (rows) => {
    const err = validateManualRows(rows);
    if (err) { alert(tr(err)); return; }
    const sets = manualRowsToSets(rows);
    storage.updateMatch(match.id, { finalSetsOverride: sets });
    setEditScore(false);
    setTick((x) => x + 1);
  };

  const handleResume = () => {
    storage.updateMatch(match.id, { status: "in_progress", endReason: null, resultWinner: null, endedAt: null });
    onContinue(match.id);
  };

  const handleDelete = () => {
    if (!confirm(tr("common.confirmDeleteMatch"))) return;
    storage.deleteMatch(match.id);
    clearLiveScore(match.id);
    if (match.teamTieId) removeMatchFromTie(match.teamTieId, match.id);
    onDeleted();
  };

  return (
    <FullScreen>
      <TopBar title={tr("summary.title")} onBack={onBack} />
      <ScrollBody style={{ padding: 16 }}>
        <Card>
          <div style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{name1}</div>
            <div style={{ fontSize: 13, color: t.textMuted, margin: "4px 0" }}>{tr("common.vs")}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{name2}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.accent, marginTop: 10 }}>{setsRow.join("  ")}</div>
            <div style={{ fontSize: 13, color: t.textSub, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="calendar" size={15} /> {match.date}{match.surface ? ` · ${surfaceLabel(lang, match.surface)}` : ""}
            </div>
            {match.endReason && (
              <div style={{ fontSize: 13, color: t.textSub, marginTop: 8 }}>
                {tr("summary.endedEarly", { reason: tr(`tracker.reason.${match.endReason}`), winner: match.resultWinner === TEAM1 ? name1 : name2 })}
              </div>
            )}
            {match.note && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{match.note}</div>}
          </div>
        </Card>

        {hasTiming && (
          <Card>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.border}`, fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>
              {tr("summary.matchDuration")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", fontSize: 15 }}>
              <span>{tr("summary.matchDuration")}</span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{formatDuration(totalDurationMs)}</strong>
            </div>
            {score && score.sets.length > 0 && (
              <div style={{ padding: "2px 14px 12px", borderTop: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, textTransform: "uppercase", margin: "8px 0 6px" }}>
                  {tr("summary.setDurations")}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {score.sets.map((s, i) => (
                    <span key={i} style={{ fontSize: 13, color: t.textSub, fontVariantNumeric: "tabular-nums" }}>
                      {tr("summary.setN", { n: i + 1 })}: <strong style={{ color: t.text }}>{formatDuration(s.durationMs)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {avgPointMs != null && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderTop: `1px solid ${t.border}`, fontSize: 13, color: t.textSub }}>
                <span>{tr("summary.avgPointLength")}</span>
                <strong style={{ color: t.text, fontVariantNumeric: "tabular-nums" }}>{formatDuration(avgPointMs)}</strong>
              </div>
            )}
            {longest && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderTop: `1px solid ${t.border}`, fontSize: 13, color: t.textSub }}>
                <span>{tr("summary.longestPoint")}</span>
                <strong style={{ color: t.text, fontVariantNumeric: "tabular-nums" }}>{formatDuration(longest.durationMs)}</strong>
              </div>
            )}
          </Card>
        )}

        {hasPointDetail && stats && (
          <Card>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.border}`, fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>
              {tr("summary.statsTitle")}
            </div>
            <div style={{ display: "flex", padding: "8px 14px", fontSize: 12, fontWeight: 800, color: t.textMuted }}>
              <span style={{ flex: 1, color: colors.a }}>{name1}</span>
              <span style={{ flex: 1, textAlign: "right", color: colors.b }}>{name2}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 10px" }}>
              <Donut a={ptsA} b={ptsB} label={tr("summary.pointsShare")} />
            </div>
            {bp && (
              <StatRow label={tr("summary.bpConverted")} a={bp.team1.opp ? bp.team1.conv / bp.team1.opp : 0} b={bp.team2.opp ? bp.team2.conv / bp.team2.opp : 0}
                aText={`${bp.team1.conv}/${bp.team1.opp}`} bText={`${bp.team2.conv}/${bp.team2.opp}`} />
            )}
            {STAT_ROWS.map(([key, labelKey]) => (
              <StatRow key={key} label={tr(labelKey)} a={stats.team1[key]} b={stats.team2[key]} higherIsBetter={key !== "doubleFaults" && key !== "unforcedErrors"} />
            ))}
            {avgRally != null && (
              <div style={{ display: "flex", justifyContent: "center", padding: "8px 14px", borderTop: `1px solid ${t.border}`, fontSize: 12, color: t.textSub }}>
                {tr("summary.avgRallyLabel")} <strong style={{ marginLeft: 4 }}>{avgRally} {tr("summary.hitsUnit")}</strong>
              </div>
            )}
          </Card>
        )}

        {timeline && (
          <Card>
            <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("summary.pointsChartTitle")}</div>
            <PointsChart timeline={timeline} nameA={name1} nameB={name2} setLabel={(n) => tr("summary.setN", { n })} />
          </Card>
        )}

        {timeline && (
          <Card>
            <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("pdf.setPointsTitle")}</div>
            <SetPointsBars timeline={timeline} setLabel={(n) => tr("summary.setN", { n })} />
          </Card>
        )}

        {timeline && timeline.games.length > 0 && (
          <Card>
            <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("pdf.gamesTitle")}</div>
            <GamesStrip timeline={timeline} setLabel={(n) => tr("summary.setN", { n })} />
          </Card>
        )}

        {gameList.length > 0 && (
          <Card>
            <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("summary.gameFlowTitle")}</div>
            <GameFlow games={gameList} nameA={name1} nameB={name2}
              chipLabel={(g) => tr("summary.gameChip", { set: g.set, game: g.game })}
              ptsLabel={(n) => tr("summary.gameFlowPts", { n })} hint={tr("summary.gameFlowHint")} />
          </Card>
        )}

        {momentum && (
          <Card>
            <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("summary.momentsTitle")}</div>
            <StatRow label={tr("summary.pointStreak")} a={momentum.pointStreak.a} b={momentum.pointStreak.b} />
            {momentum.gameStreak && <StatRow label={tr("summary.gameStreak")} a={momentum.gameStreak.a} b={momentum.gameStreak.b} />}
            {bp && (bp.team1.opp > 0 || bp.team2.opp > 0) && (
              <StatRow label={tr("summary.bpSavedRow")} a={bp.team2.opp ? (bp.team2.opp - bp.team2.conv) / bp.team2.opp : 0} b={bp.team1.opp ? (bp.team1.opp - bp.team1.conv) / bp.team1.opp : 0}
                aText={`${bp.team2.opp - bp.team2.conv}/${bp.team2.opp}`} bText={`${bp.team1.opp - bp.team1.conv}/${bp.team1.opp}`} />
            )}
            {momentum.longestGame && (
              <div style={{ padding: "10px 14px", borderTop: `1px solid ${t.border}`, fontSize: 13, color: t.textSub, lineHeight: 1.5 }}>
                {tr("summary.longestGame", { n: momentum.longestGame.points, set: momentum.longestGame.set, game: momentum.longestGame.game, name: momentum.longestGame.winner === TEAM1 ? name1 : name2 })}
              </div>
            )}
          </Card>
        )}

        {hasPointDetail && (
          <Card>
            <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: t.textSub }}>{tr("summary.flowTitle")}</div>
            <FlowChart series={flowSeries(match.pointLog)} nameA={name1} nameB={name2} />
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {match.status === "in_progress" && (
            <button style={styles.primaryBtn} onClick={() => onContinue(match.id)}><Icon name="play" size={22} />{tr("summary.continueMatch")}</button>
          )}
          {match.endReason && match.rules && onContinue && (
            <button style={styles.secondaryBtn} onClick={handleResume}><Icon name="undo" size={19} />{tr("summary.resumeMatch")}</button>
          )}
          {match.status === "completed" && (
            <button style={styles.secondaryBtn} onClick={handlePdf}>
              <Icon name="file" size={19} />{tr("summary.downloadPdf")}
            </button>
          )}
          <button
            style={styles.primaryBtn}
            onClick={() => shareMatch(`${name1} – ${name2}: ${setsRow.join(" ")}`, buildShareUrl(match, setsRow))}
          ><ShareIcon size={15} /> {tr("summary.shareResult")}</button>
          {hasPointDetail && (
            <button
              style={styles.secondaryBtn}
              onClick={() => shareMatch(`${name1} – ${name2}: ${setsRow.join(" ")}`, buildProShareUrl(match, setsRow))}
            ><ShareIcon size={15} /> {tr("summary.shareProResult")}</button>
          )}
          {onOpenH2H && match.team1.names.length >= 1 && match.team2.names.length >= 1 && (
            <button style={styles.secondaryBtn} onClick={() => onOpenH2H(match.team1.names.join(" / "), match.team2.names.join(" / "), !!match.isDoubles)}>
              <Icon name="stats" size={19} />{tr("h2h.fromSummary")}
            </button>
          )}
          {hasPointDetail && stats && (
            <button style={styles.secondaryBtn} onClick={handleShareImage}>
              <Icon name="image" size={19} />{tr("summary.shareImage")}
            </button>
          )}
          <button style={styles.secondaryBtn} onClick={() => setEditNames(true)}><Icon name="edit" size={19} />{tr("summary.editNames")}</button>
          {match.finalSetsOverride && !match.endReason && (
            <button style={styles.secondaryBtn} onClick={() => setEditScore(true)}><Icon name="edit" size={19} />{tr("summary.editScore")}</button>
          )}
          <button style={{ ...styles.secondaryBtn, background: `${t.danger}1c`, color: t.danger }} onClick={handleDelete}><Icon name="trash" size={19} />{tr("common.deleteMatch")}</button>
        </div>
      </ScrollBody>
      {editNames && <EditNamesModal names={{ team1: match.team1.names || [], team2: match.team2.names || [] }} onSave={handleSaveNames} onClose={() => setEditNames(false)} />}
      {editScore && <EditScoreModal rows={setsToManualRows(match.finalSetsOverride)} onSave={handleSaveScore} onClose={() => setEditScore(false)} />}
    </FullScreen>
  );
}
