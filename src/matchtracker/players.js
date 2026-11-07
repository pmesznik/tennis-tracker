// ─────────────────────────────────────────────────────────────────────────────
// Tennis Tracker — "pamięć" zawodników: lista znanych nazwisk, podpowiedzi
// przeciwników i ulubieni gracze, wszystko wyliczone z historii meczów
// (atz_matches) zamiast trzymane jako osobny, mogący się rozjechać stan —
// ten sam pure-derive pattern co w scoringEngine.js.
// ─────────────────────────────────────────────────────────────────────────────

import { normName, cleanName } from "./nameKey.js";

const FAVORITES_KEY = "atz_favorite_players";

export function getFavoritePlayers() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "string" && n) : [];
  } catch {
    localStorage.removeItem(FAVORITES_KEY);
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {}
}

// Używane przy imporcie kopii zapasowej (backup.js) do zapisania scalonej
// listy ulubionych naraz.
export function setFavoritePlayers(list) {
  saveFavorites(Array.isArray(list) ? list.filter((n) => typeof n === "string" && n) : []);
}

export function isFavoritePlayer(name) {
  return getFavoritePlayers().some((n) => normName(n) === normName(name));
}

// Przełącza (dodaje/usuwa) nazwisko na liście ulubionych. Zwraca nową listę.
export function toggleFavoritePlayer(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return getFavoritePlayers();
  const current = getFavoritePlayers();
  const key = normName(trimmed);
  const next = current.some((n) => normName(n) === key) ? current.filter((n) => normName(n) !== key) : [...current, trimmed];
  saveFavorites(next);
  return next;
}

// Wszystkie nazwiska, które kiedykolwiek pojawiły się w zapisanym meczu
// (obie drużyny, single i debel), do podpowiedzi przy wpisywaniu. Nazwiska są
// łączone kluczem normName (bez znaczenia wielkość liter, ogonki i kolejność
// "imię nazwisko" / "nazwisko imię"); jako zapis wyświetlany wygrywa ten, który
// padał najczęściej. opponentCounts[klucz][klucz przeciwnika] = ile razy grali.
export function buildPlayerIndex(matches) {
  const forms = new Map(); // klucz -> Map(zapis -> ile razy)
  const opponentCounts = {};

  const addForm = (n) => {
    const k = normName(n);
    if (!k) return;
    const m = forms.get(k) || new Map();
    m.set(n, (m.get(n) || 0) + 1);
    forms.set(k, m);
  };
  const bump = (a, b) => {
    if (!opponentCounts[a]) opponentCounts[a] = {};
    opponentCounts[a][b] = (opponentCounts[a][b] || 0) + 1;
  };

  for (const m of matches) {
    const names1 = (m.team1?.names || []).filter(Boolean);
    const names2 = (m.team2?.names || []).filter(Boolean);
    for (const n of [...names1, ...names2]) addForm(n);
    for (const a of names1) {
      for (const b of names2) {
        bump(normName(a), normName(b));
        bump(normName(b), normName(a));
      }
    }
  }

  const display = {};
  for (const [k, m] of forms) display[k] = [...m.entries()].sort((x, y) => y[1] - x[1])[0][0];

  return {
    allNames: Object.values(display).sort((a, b) => a.localeCompare(b)),
    opponentCounts,
    display,
  };
}

export function suggestOpponents(index, name, limit = 5) {
  const counts = index.opponentCounts[normName(name)];
  if (!counts) return [];
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => index.display[k] || k);
}

// Zapis nazwiska znany z historii (jeśli ktoś wpisze "Kowalski Jan", a wcześniej
// był "Jan Kowalski", dostaje ten sam, dotychczasowy zapis), inaczej po prostu
// oczyszczone spacje.
export function canonicalName(index, name) {
  const clean = cleanName(name);
  return (index && index.display[normName(clean)]) || clean;
}
