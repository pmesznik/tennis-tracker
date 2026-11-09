// Tennis Tracker — serie i momenty meczu: najdłuższa seria punktów i gemów z
// rzędu dla każdej strony oraz najdłuższy gem. Czyste funkcje nad zapisem
// punktów i osią czasu (timeline.js).
import { TEAM1, TEAM2 } from "./scoringEngine.js";

// Najdłuższa seria identycznych zwycięzców w tablicy (np. punktów lub gemów).
function longestRun(winners) {
  const best = { [TEAM1]: 0, [TEAM2]: 0 };
  let cur = null, n = 0;
  for (const w of winners) {
    if (w === cur) n++; else { cur = w; n = 1; }
    if (n > best[w]) best[w] = n;
  }
  return { a: best[TEAM1], b: best[TEAM2] };
}

/**
 * @param {object} match zapis meczu (pointLog)
 * @param {object|null} timeline wynik buildTimeline (dla gemów)
 * @returns {{ pointStreak:{a,b}, gameStreak:{a,b}|null, longestGame:{points,set,game,winner}|null }}
 */
export function computeMomentum(match, timeline) {
  const log = match?.pointLog || [];
  const pointStreak = longestRun(log.map((p) => p.winner));
  let gameStreak = null, longestGame = null;
  if (timeline) {
    gameStreak = longestRun(timeline.games.flat());
    // Długość gema w punktach: różnica indeksów kolejnych końców gemów w tym
    // samym secie (tie-breaki i super tie-breaki pomijamy, to nie zwykły gem).
    let prevEnd = 0, prevSet = 1, gameNo = 0;
    for (const g of timeline.gameEnds || []) {
      if (g.set !== prevSet) { prevSet = g.set; gameNo = 0; }
      gameNo++;
      const points = g.end - prevEnd;
      prevEnd = g.end;
      if (g.tb) continue;
      if (!longestGame || points > longestGame.points) longestGame = { points, set: g.set, game: gameNo, winner: g.winner };
    }
  }
  return { pointStreak, gameStreak, longestGame };
}
