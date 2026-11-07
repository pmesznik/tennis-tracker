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
import { computeStats, computeBreakPoints } from "./stats.js";

import { normName } from "./nameKey.js";
export { normName };

// Strony meczu jako tablice nazwisk: single (po jednym nazwisku, bez debla)
// albo debel (flaga isDoubles). Inny typ meczu daje null i jest pomijany.
export function matchSides(m, mode = "singles") {
  const a = (m.team1?.names || []).filter(Boolean);
  const b = (m.team2?.names || []).filter(Boolean);
  if (mode === "doubles") return m.isDoubles && a.length >= 2 && b.length >= 2 ? [a, b] : null;
  return !m.isDoubles && a.length === 1 && b.length === 1 ? [a, b] : null;
}

const labelOf = (names) => names.join(" / ");
// Klucz pary niezależny od kolejności zawodników i zapisu nazwisk.
export const teamKey = (names) => names.map(normName).sort().join("|");
const keyOfLabel = (label) => teamKey(String(label).split(" / "));

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

// Zawodnicy występujący w ukończonych meczach danego typu, z liczbą meczów.
export function listH2HPlayers(matches, mode = "singles") {
  const map = new Map();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const sides = matchSides(m, mode);
    if (!sides) continue;
    for (const n of sides.flat()) {
      const k = normName(n);
      const cur = map.get(k) || { name: n, key: k, count: 0 };
      cur.count++;
      map.set(k, cur);
    }
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

// Rywale danego zawodnika (single: zawodnicy, debel: pary rywali).
export function listH2HOpponents(matches, name, mode = "singles") {
  const key = normName(name);
  const map = new Map();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const sides = matchSides(m, mode);
    if (!sides) continue;
    const opp = sides[0].some((n) => normName(n) === key) ? sides[1] : sides[1].some((n) => normName(n) === key) ? sides[0] : null;
    if (!opp) continue;
    const k = teamKey(opp);
    const cur = map.get(k) || { name: labelOf(opp), key: k, count: 0 };
    cur.count++;
    map.set(k, cur);
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

// Pary deblowe (bez względu na kolejność zawodników) z liczbą meczów.
export function listH2HTeams(matches) {
  const map = new Map();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const sides = matchSides(m, "doubles");
    if (!sides) continue;
    for (const names of sides) {
      const k = teamKey(names);
      const cur = map.get(k) || { name: labelOf(names), key: k, count: 0 };
      cur.count++;
      map.set(k, cur);
    }
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

// Rywalne pary danej pary deblowej.
export function listH2HTeamOpponents(matches, teamLabel) {
  const key = keyOfLabel(teamLabel);
  const map = new Map();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const sides = matchSides(m, "doubles");
    if (!sides) continue;
    const opp = teamKey(sides[0]) === key ? sides[1] : teamKey(sides[1]) === key ? sides[0] : null;
    if (!opp) continue;
    const k = teamKey(opp);
    const cur = map.get(k) || { name: labelOf(opp), key: k, count: 0 };
    cur.count++;
    map.set(k, cur);
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

const zeroSide = () => ({
  matchesWon: 0, setsWon: 0, gamesWon: 0, pointsWon: 0,
  servePointsWon: 0, servePointsTotal: 0, returnPointsWon: 0, returnPointsTotal: 0,
  aces: 0, doubleFaults: 0, winners: 0, forcedErrors: 0, unforcedErrors: 0, netPoints: 0,
  bpOpp: 0, bpConv: 0, // break pointy jako returner: szanse / wykorzystane
});

function aggregate(matches, mode, pick) {
  const a = zeroSide(), b = zeroSide();
  const list = [];
  const bySurface = {};
  const opponents = new Map();
  let detailedMatches = 0;
  let totalMatches = 0, undecided = 0;

  const sorted = matches
    .filter((m) => m.status === "completed")
    .sort((x, y) => String(x.date || "").localeCompare(String(y.date || "")) || String(x.createdAt || "").localeCompare(String(y.createdAt || "")));

  for (const m of sorted) {
    const sides = matchSides(m, mode);
    if (!sides) continue;
    const aIsTeam1 = pick(sides[0], sides[1]);
    if (aIsTeam1 === null) continue;

    totalMatches++;
    const mine = aIsTeam1 ? "team1" : "team2";
    const theirs = aIsTeam1 ? "team2" : "team1";
    const { sets, winner } = matchSets(m);
    const sideOf = (team) => (team === mine ? a : b);

    if (winner) sideOf(winner).matchesWon++; else undecided++;

    const oriented = [];
    let mga = 0, mgb = 0;
    for (const s of sets) {
      const sa = aIsTeam1 ? s.a : s.b;
      const sb = aIsTeam1 ? s.b : s.a;
      if (sa > sb) a.setsWon++; else if (sb > sa) b.setsWon++;
      if (!s.isSuperTiebreak) { a.gamesWon += sa; b.gamesWon += sb; mga += sa; mgb += sb; }
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
      const bp = computeBreakPoints(m.rules, log, m.initialServer || "team1");
      a.bpOpp += bp[mine].opp; a.bpConv += bp[mine].conv;
      b.bpOpp += bp[theirs].opp; b.bpConv += bp[theirs].conv;
      const { stats } = computeStats(log);
      for (const key of ["aces", "doubleFaults", "winners", "forcedErrors", "unforcedErrors", "netPoints"]) {
        a[key] += stats[mine][key];
        b[key] += stats[theirs][key];
      }
    }

    const surf = m.surface || "—";
    const bs = bySurface[surf] || (bySurface[surf] = { a: 0, b: 0 });
    if (winner === mine) bs.a++; else if (winner === theirs) bs.b++;

    const oppName = labelOf(aIsTeam1 ? sides[1] : sides[0]);
    const ok = teamKey(String(oppName).split(" / "));
    const orec = opponents.get(ok) || { name: oppName, key: ok, played: 0, won: 0, lost: 0 };
    orec.played++;
    if (winner === mine) orec.won++; else if (winner === theirs) orec.lost++;
    opponents.set(ok, orec);

    list.push({
      id: m.id, opponent: oppName, games: [mga, mgb], date: m.date || "", surface: m.surface || null, sets: oriented,
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
    total: totalMatches, undecided, detailedMatches,
    a, b, list, bySurface, streak,
    opponents: [...opponents.values()].sort((x, y) => y.played - x.played || x.name.localeCompare(y.name)),
    totalGames: a.gamesWon + b.gamesWon,
    totalPoints: a.pointsWon + b.pointsWon,
  };
}

/**
 * Bilans spotkań dwóch zawodników (single) albo dwóch par (debel, nazwy par
 * jako "A / B"). Strony `a` i `b` są w orientacji "A kontra B" niezależnie od
 * tego, kto był team1/team2.
 */
export function computeH2H(matches, nameA, nameB, mode = "singles") {
  const [ka, kb] = [keyOfLabel(nameA), keyOfLabel(nameB)];
  const r = aggregate(matches, mode, (s1, s2) => {
    const k1 = teamKey(s1), k2 = teamKey(s2);
    return k1 === ka && k2 === kb ? true : k1 === kb && k2 === ka ? false : null;
  });
  return { nameA, nameB, mode, ...r };
}

/**
 * Statystyki jednego zawodnika ze wszystkich jego ukończonych meczów danego
 * typu: `a` to jego strona (w deblu: z dowolnym partnerem), `b` to suma
 * rywali. `opponents` zawiera bilans z każdym rywalem (parą) z osobna.
 */
export function computePlayerStats(matches, name, mode = "singles") {
  const k = normName(name);
  const r = aggregate(matches, mode, (s1, s2) =>
    s1.some((n) => normName(n) === k) ? true : s2.some((n) => normName(n) === k) ? false : null);
  return { name, mode, ...r };
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
