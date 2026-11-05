// ─────────────────────────────────────────────────────────────────────────────
// Tennis Tracker — statystyki punktowe meczu, liczone z pointLog.
//
// Wydzielone z MatchSummaryPage.jsx, żeby ta sama logika mogła zasilić też
// link "karta Pro" (shareLink.js) bez powielania kodu.
// ─────────────────────────────────────────────────────────────────────────────

import { computeScore } from "./scoringEngine.js";

export function emptyStats() {
  return { aces: 0, doubleFaults: 0, winners: 0, forcedErrors: 0, unforcedErrors: 0, netPoints: 0 };
}

export function computeStats(pointLog) {
  const stats = { team1: emptyStats(), team2: emptyStats() };
  let rallyTotal = 0, rallyCount = 0;
  for (const p of pointLog) {
    if (p.endType === "ace") stats[p.winner].aces++;
    if (p.endType === "doubleFault") stats[p.server].doubleFaults++;
    if (p.endType === "winner" && p.endBy) stats[p.endBy].winners++;
    if (p.endType === "forcedError" && p.endBy) stats[p.endBy].forcedErrors++;
    if (p.endType === "unforcedError" && p.endBy) stats[p.endBy].unforcedErrors++;
    if (p.atNet && p.endBy) stats[p.endBy].netPoints++;
    if (typeof p.rallyLength === "number") { rallyTotal += p.rallyLength; rallyCount++; }
  }
  return { stats, avgRally: rallyCount ? (rallyTotal / rallyCount).toFixed(1) : null };
}

// ─── Break pointy ───────────────────────────────────────────────────────────
// Break point = punkt, po którego wygraniu returner wygrywa gem (przewaga
// returnera przy 40 lub "Ad", a w grze bez przewag także decydujący punkt przy
// 40:40). Tie-breaki nie mają break pointów. Stan gema przed każdym punktem
// bierzemy z silnika (computeScore), żeby nie powielać reguł punktacji.
const PTS = { "0": 0, "15": 1, "30": 2, "40": 3, "Ad": 4 };

export function computeBreakPoints(rules, pointLog, initialServer = "team1") {
  const out = { team1: { opp: 0, conv: 0 }, team2: { opp: 0, conv: 0 } };
  if (!rules || !pointLog?.length) return out;
  for (let i = 0; i < pointLog.length; i++) {
    const g = computeScore(rules, pointLog.slice(0, i), initialServer).game;
    if (!g || g.isTiebreak || !g.server) continue;
    const returner = g.server === "team1" ? "team2" : "team1";
    const sLabel = g.server === "team1" ? g.a : g.b;
    const rLabel = returner === "team1" ? g.a : g.b;
    const s = PTS[sLabel], r = PTS[rLabel];
    const isBP = rLabel === "Ad" || (r === 3 && s < 3) || (rules.noAd && r === 3 && s === 3);
    if (!isBP) continue;
    out[returner].opp++;
    if (pointLog[i].winner === returner) out[returner].conv++;
  }
  return out;
}

// Przebieg meczu: różnica punktów (team1 minus team2) po kolejnych punktach,
// ewentualnie zredukowana do maxPoints próbek (do wykresu i linku).
export function flowSeries(pointLog, maxPoints = 140) {
  let d = 0;
  const all = [0];
  for (const p of pointLog) { d += p.winner === "team1" ? 1 : -1; all.push(d); }
  if (all.length <= maxPoints) return all;
  const step = (all.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => all[Math.round(i * step)]);
}

