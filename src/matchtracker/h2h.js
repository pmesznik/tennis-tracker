// ─────────────────────────────────────────────────────────────────────────────
// Tennis Tracker — statystyki łączne "zawodnik kontra rywal" (H2H).
//
// Czysta funkcja nad listą zapisanych meczów (bez własnego stanu, jak
// players.js): z historii wyciąga ukończone single dwóch zawodników i liczy
// mecze, sety, gemy oraz punkty. Punkty i statystyki szczegółowe pochodzą tylko
// z meczów śledzonych punkt po punkcie (pointLog); wyniki wpisane ręcznie
// ("Zapisz wynik") liczą się do meczów, setów i gemów.
// ─────────────────────────────────────────────────────────────────────────────
import { computeScore } from "./scoringEngine.js";
import { computeStats } from "./stats.js";

export function normName(n) {
  return String(n || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l").replace(/Ł/g, "L")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

function singlesNames(m) {
  const a = (m.team1?.names || []).filter(Boolean);
  const b = (m.team2?.names || []).filter(Boolean);
  if (m.isDoubles || a.length !== 1 || b.length !== 1) return null;
  return [a[0], b[0]];
}

// Sety meczu jako [{a,b,isSuperTiebreak,tiebreak?}] oraz zwycięzca ("team1"/"team2"/null).
function matchSets(m) {
  if (m.finalSetsOverride) {
    const sets = m.finalSetsOverride;
    let a = 0, b = 0;
    for (const s of sets) { if (s.a > s.b) a++; else if (s.b > s.a) b++; }
    return { sets, winner: a === b ? null : a > b ? "team1" : "team2" };
  }
  if (!m.rules) return { sets: [], winner: null };
  const sc = computeScore(m.rules, m.pointLog || [], m.initialServer || "team1", m.startedAt);
  return { sets: sc.sets, winner: sc.matchWinner };
}

// Nazwiska zawodników występujących w ukończonych singlach, z liczbą meczów.
export function listH2HPlayers(matches) {
  const map = new Map();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const names = singlesNames(m);
    if (!names) continue;
    for (const n of names) {
      const k = normName(n);
      const cur = map.get(k) || { name: n, key: k, count: 0 };
      cur.count++;
      map.set(k, cur);
    }
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

// Rywale danego zawodnika (z liczbą wspólnych meczów).
export function listH2HOpponents(matches, name) {
  const key = normName(name);
  const map = new Map();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const names = singlesNames(m);
    if (!names) continue;
    const [n1, n2] = names;
    let opp = null;
    if (normName(n1) === key) opp = n2; else if (normName(n2) === key) opp = n1;
    if (!opp) continue;
    const k = normName(opp);
    const cur = map.get(k) || { name: opp, key: k, count: 0 };
    cur.count++;
    map.set(k, cur);
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

const zeroSide = () => ({
  matchesWon: 0, setsWon: 0, gamesWon: 0, pointsWon: 0,
  servePointsWon: 0, servePointsTotal: 0, returnPointsWon: 0, returnPointsTotal: 0,
  aces: 0, doubleFaults: 0, winners: 0, forcedErrors: 0, unforcedErrors: 0, netPoints: 0,
});

/**
 * Bilans spotkań dwóch zawodników. Zwraca stronę `a` i `b` w orientacji
 * "zawodnik A kontra zawodnik B" niezależnie od tego, kto był team1/team2.
 */
export function computeH2H(matches, nameA, nameB) {
  const ka = normName(nameA), kb = normName(nameB);
  const a = zeroSide(), b = zeroSide();
  const list = [];
  const bySurface = {};
  let detailedMatches = 0;
  let totalMatches = 0, undecided = 0;

  const sorted = matches
    .filter((m) => m.status === "completed")
    .sort((x, y) => String(x.date || "").localeCompare(String(y.date || "")) || String(x.createdAt || "").localeCompare(String(y.createdAt || "")));

  for (const m of sorted) {
    const names = singlesNames(m);
    if (!names) continue;
    const k1 = normName(names[0]), k2 = normName(names[1]);
    let aIsTeam1;
    if (k1 === ka && k2 === kb) aIsTeam1 = true;
    else if (k1 === kb && k2 === ka) aIsTeam1 = false;
    else continue;

    totalMatches++;
    const mine = aIsTeam1 ? "team1" : "team2";
    const theirs = aIsTeam1 ? "team2" : "team1";
    const { sets, winner } = matchSets(m);
    const sideOf = (team) => (team === mine ? a : b);

    if (winner) sideOf(winner).matchesWon++; else undecided++;

    const oriented = [];
    for (const s of sets) {
      const sa = aIsTeam1 ? s.a : s.b;
      const sb = aIsTeam1 ? s.b : s.a;
      if (sa > sb) a.setsWon++; else if (sb > sa) b.setsWon++;
      if (!s.isSuperTiebreak) { a.gamesWon += sa; b.gamesWon += sb; }
      const tb = s.tiebreak ? `(${Math.min(s.tiebreak.a, s.tiebreak.b)})` : "";
      oriented.push(s.isSuperTiebreak ? `[${sa}-${sb}]` : `${sa}-${sb}${tb}`);
    }

    const log = m.finalSetsOverride ? [] : (m.pointLog || []);
    if (log.length) {
      detailedMatches++;
      for (const p of log) {
        const w = p.winner === mine ? a : b;
        w.pointsWon++;
        if (p.server === mine) {
          a.servePointsTotal++; b.returnPointsTotal++;
          if (p.winner === mine) a.servePointsWon++; else b.returnPointsWon++;
        } else if (p.server === theirs) {
          b.servePointsTotal++; a.returnPointsTotal++;
          if (p.winner === theirs) b.servePointsWon++; else a.returnPointsWon++;
        }
      }
      const { stats } = computeStats(log);
      for (const key of ["aces", "doubleFaults", "winners", "forcedErrors", "unforcedErrors", "netPoints"]) {
        a[key] += stats[mine][key];
        b[key] += stats[theirs][key];
      }
    }

    const surf = m.surface || "—";
    const bs = bySurface[surf] || (bySurface[surf] = { a: 0, b: 0 });
    if (winner === mine) bs.a++; else if (winner === theirs) bs.b++;

    list.push({
      id: m.id, date: m.date || "", surface: m.surface || null, sets: oriented,
      winner: winner ? (winner === mine ? "a" : "b") : null,
    });
  }

  // Aktualna seria zwycięstw (od najnowszego meczu).
  let streak = { who: null, count: 0 };
  for (let i = list.length - 1; i >= 0; i--) {
    const w = list[i].winner;
    if (!w) break;
    if (!streak.who) streak = { who: w, count: 1 };
    else if (streak.who === w) streak.count++;
    else break;
  }

  return {
    nameA, nameB, total: totalMatches, undecided, detailedMatches,
    a, b, list, bySurface, streak,
    totalGames: a.gamesWon + b.gamesWon,
    totalPoints: a.pointsWon + b.pointsWon,
  };
}

export const pct = (won, total) => (total ? Math.round((won / total) * 100) : null);

// Krótkie podsumowanie tekstowe do wysłania komunikatorem.
export function h2hText(h, labels) {
  const L = labels;
  const lines = [
    `${h.nameA} – ${h.nameB}`,
    `${L.matches}: ${h.a.matchesWon}:${h.b.matchesWon} (${h.total})`,
    `${L.sets}: ${h.a.setsWon}:${h.b.setsWon}`,
    `${L.games}: ${h.a.gamesWon}:${h.b.gamesWon}`,
  ];
  if (h.detailedMatches) lines.push(`${L.points}: ${h.a.pointsWon}:${h.b.pointsWon}`);
  return lines.join("\n");
}
