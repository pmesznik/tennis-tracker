// Tennis Tracker — oś czasu meczu do wykresów i PDF: punkty narastająco dla
// obu stron, indeksy końców setów oraz kolejność wygranych gemów w każdym secie.
// Czysta funkcja nad zapisem meczu (replay silnika punktacji), bez stanu.
import { computeScore, TEAM1, TEAM2 } from "./scoringEngine.js";

/**
 * @returns {null | { a:number[], b:number[], setEnds:number[], games:string[][] }}
 *  a, b      punkty narastająco po kolejnych punktach (indeks 0 = start meczu)
 *  setEnds   indeks w a/b, po którym skończył się kolejny set
 *  games     dla każdego seta lista zwycięzców gemów ("team1" | "team2")
 */
export function buildTimeline(match) {
  const rules = match?.rules;
  const log = match?.pointLog || [];
  if (!rules || log.length === 0) return null;
  const init = match.initialServer || TEAM1;
  const a = [0], b = [0];
  let ca = 0, cb = 0;
  const setEnds = [];
  const games = [[]];
  let prev = computeScore(rules, [], init, match.startedAt);
  for (let i = 0; i < log.length; i++) {
    if (log[i].winner === TEAM1) ca++; else cb++;
    a.push(ca); b.push(cb);
    const cur = computeScore(rules, log.slice(0, i + 1), init, match.startedAt);
    if (cur.sets.length > prev.sets.length) {
      const last = cur.sets[cur.sets.length - 1];
      games[games.length - 1].push(last.a > last.b ? TEAM1 : TEAM2);
      setEnds.push(i + 1);
      games.push([]);
    } else if (cur.curSetGamesA !== prev.curSetGamesA || cur.curSetGamesB !== prev.curSetGamesB) {
      games[games.length - 1].push(cur.curSetGamesA > prev.curSetGamesA ? TEAM1 : TEAM2);
    }
    prev = cur;
  }
  while (games.length && games[games.length - 1].length === 0) games.pop();
  return { a, b, setEnds, games };
}

// Zmniejsza serię do maxPoints próbek (do rysowania), zachowując ostatni punkt.
export function sampleIndexes(n, maxPoints = 200) {
  if (n + 1 <= maxPoints) return Array.from({ length: n + 1 }, (_, i) => i);
  const step = n / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => Math.round(i * step));
}
