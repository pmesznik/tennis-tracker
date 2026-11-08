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
// tbA / tbB = punkty tie-breaka seta po stronie A i B (np. 7-6 i 7:5).
// Wystarczy wpisać jedną stronę: druga zostanie dopowiedziana (7-6 i 5 daje 7:5).
// Stare pole tb = punkty przegranego nadal jest rozumiane.
export const isTiebreakScore = (a, b) => {
  const x = parseInt(a, 10), y = parseInt(b, 10);
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) === 1 && [4, 7, 9].includes(Math.max(x, y)); // 4:3, 7:6, 9:8
};

export function manualRowsToSets(rows) {
  return rows
    .filter((r) => r.a !== "" && r.b !== "")
    .map((r) => {
      const a = parseInt(r.a, 10), b = parseInt(r.b, 10);
      if (r.superTb) return { a, b, isSuperTiebreak: true };
      if (isTiebreakScore(a, b)) {
        const num = (v) => { const n = parseInt(v, 10); return v !== "" && v != null && Number.isFinite(n) && n >= 0 ? n : null; };
        const ta = num(r.tbA), tb = num(r.tbB), legacy = num(r.tb);
        const aWon = a > b;
        const win = (loser) => Math.max(7, loser + 2);
        let tiebreak = null;
        if (ta != null && tb != null) {
          // zwycięzca seta wygrywa tie-break; przy odwróconych wartościach zamieniamy
          tiebreak = (ta > tb) === aWon ? { a: ta, b: tb } : { a: tb, b: ta };
        } else {
          // jedna liczba: w polu przegranego (i stare pole tb) to punkty przegranego;
          // w polu zwycięzcy wartość powyżej 7 daje przegranego o 2 mniej.
          const only = ta ?? tb ?? legacy;
          if (only != null) {
            const inWinnerBox = (ta != null && aWon) || (tb != null && !aWon);
            const loser = inWinnerBox ? (only > 7 ? only - 2 : null) : only;
            if (loser != null) tiebreak = aWon ? { a: win(loser), b: loser } : { a: loser, b: win(loser) };
          }
        }
        if (tiebreak && !r.partial) return { a, b, tiebreak };
      }
      if (r.partial) return { a, b, partial: true };
      return { a, b };
    });
}

export function setsToManualRows(sets) {
  return (sets || []).map((s) => ({
    a: String(s.a), b: String(s.b),
    tbA: s.tiebreak ? String(s.tiebreak.a) : "", tbB: s.tiebreak ? String(s.tiebreak.b) : "",
    superTb: !!s.isSuperTiebreak, partial: !!s.partial,
  }));
}

// Sprawdza wiersze wyniku. Zwraca klucz błędu i18n albo null, gdy wszystko gra.
export function validateManualRows(rows) {
  let filled = 0;
  for (const r of rows) {
    const hasA = r.a !== "" && r.a != null, hasB = r.b !== "" && r.b != null;
    if (hasA !== hasB) return "setup.errIncomplete";
    if (!hasA) continue;
    filled++;
    const a = parseInt(r.a, 10), b = parseInt(r.b, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) return "setup.errIncomplete";
    if (a === b && !r.partial) return "setup.errDraw";
  }
  return filled === 0 ? "setup.alertNeedOneSet" : null;
}
