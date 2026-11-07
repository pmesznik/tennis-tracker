// Tennis Tracker — poprawki w już założonym meczu: imiona i nazwiska, pierwszy
// serwujący, ręcznie wpisany wynik. Każda funkcja zwraca "łatkę" (patch) do
// storage.updateMatch, więc da się je testować bez przeglądarki.
import { buildPlayerIndex, canonicalName } from "./players.js";
import { cleanName } from "./nameKey.js";
import { otherTeam } from "./scoringEngine.js";

/**
 * Nowe nazwiska stron. Nazwisko trafia w zapisie znanym z historii innych
 * meczów (kolejność "imię nazwisko" nie ma znaczenia), puste pole zostawia
 * dotychczasowe. Kolejność serwisu w deblu przechodzi na nowe nazwiska.
 */
export function buildRenamePatch(match, n1, n2, otherMatches, fallback1 = "Gracz 1", fallback2 = "Gracz 2") {
  const idx = buildPlayerIndex(otherMatches);
  const fix = (arr, old, fb) => arr.map((v, i) => canonicalName(idx, cleanName(v)) || old[i] || fb);
  const old1 = match.team1.names || [], old2 = match.team2.names || [];
  const new1 = fix(n1, old1, fallback1), new2 = fix(n2, old2, fallback2);
  const rename = new Map([...old1.map((o, i) => [o, new1[i]]), ...old2.map((o, i) => [o, new2[i]])]);
  const mapArr = (arr) => arr.map((nm) => rename.get(nm) || nm);
  const patch = { team1: { ...match.team1, names: new1 }, team2: { ...match.team2, names: new2 } };
  if (match.serverOrder) {
    patch.serverOrder = Object.fromEntries(Object.entries(match.serverOrder).map(([team, arr]) => [team, mapArr(arr)]));
  }
  if (match.serverOrderBySet) {
    patch.serverOrderBySet = Object.fromEntries(Object.entries(match.serverOrderBySet).map(([k, teams]) => [k,
      Object.fromEntries(Object.entries(teams).map(([team, arr]) => [team, mapArr(arr)]))]));
  }
  return patch;
}

/**
 * Zamiana pierwszego serwującego (pomyłka na starcie): odwraca initialServer
 * i serwującego w każdym zapisanym punkcie, więc wynik, statystyki serwisu i
 * break pointy przeliczają się od nowa. Kolejność serwisu zawodników w deblu
 * (kto z pary serwuje pierwszy) zostaje bez zmian.
 */
export function buildSwapServerPatch(match) {
  const first = match.initialServer;
  if (!first) return {};
  return {
    initialServer: otherTeam(first),
    pointLog: (match.pointLog || []).map((p) => (p.server ? { ...p, server: otherTeam(p.server) } : p)),
  };
}

// Wiersze edytora wyniku <-> sety w formacie finalSetsOverride.
// tb = punkty PRZEGRANEGO w tie-breaku seta (7-6 i 5 daje 7-6(5)).
export function manualRowsToSets(rows) {
  return rows
    .filter((r) => r.a !== "" && r.b !== "")
    .map((r) => {
      const a = parseInt(r.a, 10), b = parseInt(r.b, 10);
      if (r.superTb) return { a, b, isSuperTiebreak: true };
      const tbLoser = parseInt(r.tb, 10);
      if (r.tb !== "" && Number.isFinite(tbLoser) && tbLoser >= 0 && Math.abs(a - b) === 1 && Math.max(a, b) >= 6) {
        const tbWin = Math.max(7, tbLoser + 2);
        return { a, b, tiebreak: { a: a > b ? tbWin : tbLoser, b: a > b ? tbLoser : tbWin } };
      }
      return { a, b };
    });
}

export function setsToManualRows(sets) {
  return (sets || []).map((s) => ({
    a: String(s.a), b: String(s.b),
    tb: s.tiebreak ? String(Math.min(s.tiebreak.a, s.tiebreak.b)) : "",
    superTb: !!s.isSuperTiebreak,
  }));
}
