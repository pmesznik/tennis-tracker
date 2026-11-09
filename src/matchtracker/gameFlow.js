// Tennis Tracker — przebieg pojedynczych gemów do wykresu „Przebieg gema":
// dla każdego zakończonego gemu lista punktów (kto wygrał) z podpisem wyniku
// zwycięzcy punktu (15, 30, 40, AD, gem; w tie-breaku sama liczba punktów).
import { TEAM1 } from "./scoringEngine.js";

const STEPS = ["0", "15", "30", "40"];

// Podpis wyniku zwycięzcy punktu po tym punkcie. wa/wb: punkty zwycięzcy i rywala.
export function pointLabel(wa, wb, isTb, isLast) {
  if (isLast) return "gem";
  if (isTb) return String(wa);
  if (wa >= 3 && wb >= 3) return wa > wb ? "AD" : "40";
  return STEPS[Math.min(wa, 3)];
}

/**
 * @returns {Array<{set:number, game:number, tb:boolean, winner:string, points:{a:boolean,label:string}[]}>}
 *  a = true, gdy punkt wygrał zawodnik A (team1)
 */
export function buildGames(match, timeline) {
  const log = match?.pointLog || [];
  const ends = timeline?.gameEnds || [];
  const out = [];
  let prevEnd = 0, prevSet = 1, gameNo = 0;
  for (const g of ends) {
    if (g.set !== prevSet) { prevSet = g.set; gameNo = 0; }
    gameNo++;
    let ca = 0, cb = 0;
    const slice = log.slice(prevEnd, g.end);
    const points = slice.map((p, i) => {
      const a = p.winner === TEAM1;
      if (a) ca++; else cb++;
      const label = pointLabel(a ? ca : cb, a ? cb : ca, g.tb, i === slice.length - 1);
      return { a, label };
    });
    prevEnd = g.end;
    if (points.length) out.push({ set: g.set, game: gameNo, tb: g.tb, winner: g.winner, points });
  }
  return out;
}
