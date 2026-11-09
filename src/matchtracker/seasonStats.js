// Tennis Tracker — statystyki sezonu: bilans, najdłuższa seria zwycięstw, mecze
// w miesiącach, najlepsza nawierzchnia i najczęstszy rywal. Czysta funkcja nad
// listą meczów z aggregate() (h.list): pola date, surface, winner ("a"/"b"/null), opponent.

// Lata, w których były mecze (malejąco), z listy meczów o polu date "RRRR-MM-DD".
export function yearsOf(matches) {
  const set = new Set();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const y = String(m.date || "").slice(0, 4);
    if (/^\d{4}$/.test(y)) set.add(y);
  }
  return [...set].sort().reverse();
}

export function filterByYear(matches, year) {
  if (!year || year === "all") return matches;
  return matches.filter((m) => String(m.date || "").slice(0, 4) === year);
}

export function seasonSummary(list) {
  const played = list.filter((m) => m.winner).length;
  const won = list.filter((m) => m.winner === "a").length;
  const lost = list.filter((m) => m.winner === "b").length;

  let bestStreak = 0, run = 0;
  for (const m of list) {
    if (m.winner === "a") { run++; if (run > bestStreak) bestStreak = run; } else if (m.winner === "b") run = 0;
  }

  const months = new Map();
  for (const m of list) {
    const key = String(m.date || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key) || !m.winner) continue;
    const cur = months.get(key) || { key, w: 0, l: 0 };
    if (m.winner === "a") cur.w++; else cur.l++;
    months.set(key, cur);
  }
  const byMonth = [...months.values()].sort((x, y) => x.key.localeCompare(y.key));

  const surf = new Map();
  for (const m of list) {
    if (!m.surface || !m.winner) continue;
    const cur = surf.get(m.surface) || { surface: m.surface, w: 0, total: 0 };
    cur.total++;
    if (m.winner === "a") cur.w++;
    surf.set(m.surface, cur);
  }
  // Najlepsza nawierzchnia: najwyższy odsetek zwycięstw przy co najmniej 2 meczach.
  const bestSurface = [...surf.values()].filter((s) => s.total >= 2)
    .sort((x, y) => y.w / y.total - x.w / x.total || y.total - x.total)[0] || null;

  const opp = new Map();
  for (const m of list) {
    if (!m.opponent) continue;
    const cur = opp.get(m.opponent) || { name: m.opponent, n: 0 };
    cur.n++;
    opp.set(m.opponent, cur);
  }
  const topOpponent = [...opp.values()].sort((x, y) => y.n - x.n || x.name.localeCompare(y.name))[0] || null;

  return { played, won, lost, winPct: played ? Math.round((won / played) * 100) : null, bestStreak, byMonth, bestSurface, topOpponent };
}
