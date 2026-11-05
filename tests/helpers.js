import { PRESETS } from "../src/matchtracker/scoringEngine.js";

// Generuje pointLog: każdy gem wygrywa `winner` 4:0, serwis alternuje co gem.
export function gamesLog(spec, initialServer = "team1") {
  const log = [];
  spec.forEach((w, i) => {
    const server = i % 2 === 0 ? initialServer : initialServer === "team1" ? "team2" : "team1";
    for (let k = 0; k < 4; k++) log.push({ winner: w, server, t: 1000 + log.length });
  });
  return log;
}

// Kolejność gemów tak, by przeciwnik nie wygrał seta wcześniej.
export function setSpec(winner, loser, wGames, lGames) {
  const out = [];
  let w = 0, l = 0;
  while (w < wGames || l < lGames) {
    if (l < lGames && (w > l || w === wGames)) { out.push(loser); l++; } else { out.push(winner); w++; }
  }
  return out;
}

export const rulesTb = PRESETS.best_of_3_tb;

export function match(over = {}) {
  return {
    id: over.id || Math.random().toString(36).slice(2),
    status: "completed", isDoubles: false, rules: rulesTb, trackingDepth: "basic",
    date: "2026-01-01", surface: "Twarda", initialServer: "team1", pointLog: [],
    team1: { names: ["Ala"] }, team2: { names: ["Ola"] }, finalSetsOverride: null,
    ...over,
  };
}
