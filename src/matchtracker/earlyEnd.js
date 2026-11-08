// Tennis Tracker — mecz zakończony przed czasem: krecz (rezygnacja w trakcie),
// walkower (rywal się nie stawił), dyskwalifikacja. Mecz dostaje pola
// `endReason` ("retired" | "walkover" | "disqualified") i `resultWinner`
// ("team1" | "team2"); punkty (pointLog) zostają, więc statystyki do chwili
// przerwania nadal się liczą.
import { computeScore, formatSetsString } from "./scoringEngine.js";

export const END_REASONS = ["retired", "walkover", "disqualified"];

// Wynik do chwili przerwania: ukończone sety + trwający set jako częściowy
// ({partial:true}, nie liczy się jako wygrany set, ale gemy się liczą).
// Walkower nie ma wyniku (brak setów).
export function earlyResult(m) {
  // Wynik wpisany ręcznie ("Zapisz wynik"): sety są podane wprost, niedokończony
  // set ma flagę partial. Walkower nie ma setów.
  if (!m.rules && Array.isArray(m.finalSetsOverride)) {
    const sets = m.endReason === "walkover" ? [] : m.finalSetsOverride;
    return { sets, winner: m.resultWinner || null };
  }
  const sc = m.rules
    ? computeScore(m.rules, m.pointLog || [], m.initialServer || "team1", m.startedAt)
    : { sets: [], curSetGamesA: 0, curSetGamesB: 0 };
  const sets = m.endReason === "walkover" ? [] : [...sc.sets];
  const st = sc.setStartGames || 0;
  if (m.endReason !== "walkover" && (sc.curSetGamesA !== st || sc.curSetGamesB !== st)) {
    sets.push({ a: sc.curSetGamesA, b: sc.curSetGamesB, partial: true });
  }
  return { sets, winner: m.resultWinner || null };
}

// Krótka etykieta do listy / udostępniania: "krecz", "walkower", "dyskw.".
export const END_TAG = { retired: "Krecz", walkover: "Walkower", disqualified: "Dyskw." };

// Wiersz setów (tablica napisów) dla zakończonego przedwcześnie meczu.
export function earlySetsRow(m) {
  const { sets } = earlyResult(m);
  const row = sets.map((s) => formatSetsString([s]));
  row.push(END_TAG[m.endReason] || "");
  return row.filter(Boolean);
}
