// Tennis Tracker — dodatkowe dane meczu na żywo dla widoku obserwatora (v2):
// zegary (czas meczu i punktu w momencie publikacji), punkty, przebieg meczu,
// punkty bieżącego gema oraz statystyki. Czysta funkcja nad zapisem meczu.
import { computeStats, computeBreakPoints, flowSeries } from "./stats.js";
import { buildTimeline } from "./timeline.js";
import { TEAM1, TEAM2, computeScore } from "./scoringEngine.js";

/**
 * @param {object} match zapis meczu
 * @param {object} score wynik z computeScore
 * @param {number} [nowMs] bieżący czas (do testów)
 */
export function buildLiveExtras(match, score, nowMs = Date.now()) {
  const log = match.pointLog || [];
  const paused = match.pausedAt != null;
  const pausedMs = match.pausedMs || 0;
  const activeNow = (paused ? match.pausedAt : nowMs) - pausedMs;
  const finished = !!(match.resultWinner || score?.matchWinner);
  const ex = { v: 2, ts: nowMs };
  if (match.startedAt != null && !finished) {
    ex.ms = Math.max(0, activeNow - match.startedAt);
    const last = log.length ? log[log.length - 1].t : null;
    const start = last ?? score?.currentSetStartedAt ?? match.startedAt;
    ex.ps = start != null ? Math.max(0, activeNow - start) : null;
  }
  ex.pts = [log.filter((p) => p.winner === TEAM1).length, log.filter((p) => p.winner !== TEAM1).length];
  if (log.length > 1) ex.fl = flowSeries(log, 80);
  try {
    const tl = match.rules && log.length ? buildTimeline(match) : null;
    const lastEnd = tl && tl.gameEnds.length ? tl.gameEnds[tl.gameEnds.length - 1].end : 0;
    const cur = log.slice(lastEnd);
    if (cur.length) ex.gp = cur.map((p) => (p.winner === TEAM1 ? "a" : "b")).join("");
    // punkty bieżącego seta; "|" oddziela zakończone gemy (do wykresu „punkty w secie")
    const setStart = tl && tl.setEnds.length ? tl.setEnds[tl.setEnds.length - 1] : 0;
    const inSet = log.slice(setStart);
    if (inSet.length) {
      const cuts = new Set((tl ? tl.gameEnds : []).map((g) => g.end - setStart).filter((e) => e > 0 && e < inSet.length));
      ex.sp = inSet.map((p, k) => (p.winner === TEAM1 ? "a" : "b") + (cuts.has(k + 1) ? "|" : "")).join("");
    }
  } catch { /* bez wykresu gema */ }
  const st = liveStatus(match, score);
  if (st) { ex.ss = st.k; if (st.w) ex.sw = st.w; }
  if (match.trackingDepth !== "basic" && log.length) {
    const { stats } = computeStats(log);
    ex.st1 = stats.team1; ex.st2 = stats.team2;
    try {
      const bp = computeBreakPoints(match.rules, log, match.initialServer || TEAM1);
      ex.bp1 = [bp.team1.conv, bp.team1.opp]; ex.bp2 = [bp.team2.conv, bp.team2.opp];
    } catch { /* bez break pointów */ }
  }
  return ex;
}

// Stan gry do napisu na ekranie obserwatora: piłka meczowa/setowa, break point,
// przewaga, równowaga, tie-break, zmiana stron. Pauza ma własną plakietkę.
export function liveStatus(match, score) {
  if (!score || !match.rules || score.matchWinner || match.resultWinner || match.endReason) return null;
  const log = match.pointLog || [];
  const init = match.initialServer || TEAM1;
  const server = score.pointServer ?? score.server;
  if (score.isMatchPoint) return { k: "matchpoint" };
  try {
    const next = (w) => computeScore(match.rules, [...log, { winner: w, server }], init, match.startedAt);
    const n1 = next(TEAM1), n2 = next(TEAM2);
    if (n1.sets.length > score.sets.length || n2.sets.length > score.sets.length) return { k: "setpoint" };
    if (!score.game?.isTiebreak) {
      const returner = server === TEAM1 ? n2 : n1;
      if (returner.completedGames > score.completedGames) return { k: "breakpoint" };
    }
  } catch { /* bez napisu break/set point */ }
  if (score.game?.isTiebreak) return { k: "tiebreak" };
  if (score.game?.a === "Ad") return { k: "advantage", w: TEAM1 };
  if (score.game?.b === "Ad") return { k: "advantage", w: TEAM2 };
  if (score.game?.deuce) return { k: "deuce" };
  const gamesInSet = score.curSetGamesA + score.curSetGamesB - 2 * (score.setStartGames || 0);
  const fresh = score.game && score.game.a === "0" && score.game.b === "0" && !score.game.isTiebreak;
  if (log.length > 0 && fresh && (gamesInSet % 2 === 1 || gamesInSet === 0)) return { k: "changeover" };
  return null;
}
