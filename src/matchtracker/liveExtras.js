// Tennis Tracker — dodatkowe dane meczu na żywo dla widoku obserwatora (v2):
// zegary (czas meczu i punktu w momencie publikacji), punkty, przebieg meczu,
// punkty bieżącego gema oraz statystyki. Czysta funkcja nad zapisem meczu.
import { computeStats, computeBreakPoints, flowSeries } from "./stats.js";
import { buildTimeline } from "./timeline.js";
import { TEAM1 } from "./scoringEngine.js";

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
    ex.tb = !!score?.game?.isTiebreak;
  } catch { /* bez wykresu gema */ }
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
