// ─────────────────────────────────────────────────────────────────────────────
// Tennis Tracker — eksport/import kopii zapasowej historii meczów do pliku
// (na wypadek zmiany telefonu). Zwykły plik JSON — bez chmury, bez backendu,
// dokładnie w duchu reszty aplikacji (localStorage only).
// ─────────────────────────────────────────────────────────────────────────────
import * as storage from "./storage.js";
import { getFavoritePlayers, setFavoritePlayers } from "./players.js";
import { listTeamTies, replaceAllTeamTies } from "./teamTies.js";
import { getProfile, saveProfile } from "./profile.js";
import { localDateStr } from "./time.js";

export function exportBackup() {
  const data = {
    app: "tennis-tracker",
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    matches: storage.listMatches(),
    favoritePlayers: getFavoritePlayers(),
    teamTies: listTeamTies(),
    profile: getProfile(),
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tennis-tracker-backup-${localDateStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read-failed"));
    reader.readAsText(file);
  });
}

// Scala z tym, co już jest na urządzeniu — mecze o tym samym id są nadpisane
// wersją z pliku, pozostałe zostają bez zmian. Nigdy nie kasuje lokalnych
// danych, których nie ma w pliku, więc jest bezpieczny zarówno na nowym
// telefonie (pusto → import = pełne odtworzenie), jak i na już używanym.
// Rekord bez imion, listy punktów albo reguł/wyniku zepsułby listę meczów,
// więc przy imporcie takie rekordy są pomijane.
export function isValidMatch(m) {
  if (!m || typeof m !== "object" || !m.id) return false;
  const names = (t) => Array.isArray(t?.names) && t.names.length > 0 && t.names.every((n) => typeof n === "string");
  if (!names(m.team1) || !names(m.team2)) return false;
  if (!Array.isArray(m.pointLog)) return false;
  return m.rules ? typeof m.rules === "object" : Array.isArray(m.finalSetsOverride);
}

export async function importBackupFile(file) {
  const text = await readFileAsText(file);
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.matches)) {
    throw new Error("invalid-backup-file");
  }

  const current = storage.listMatches();
  const byId = new Map(current.map((m) => [m.id, m]));
  let skipped = 0;
  for (const m of data.matches) {
    if (isValidMatch(m)) byId.set(m.id, m);
    else skipped++;
  }
  // Najnowsze mecze na górze (mecze z pliku trafiały na koniec listy).
  const merged = [...byId.values()].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  if (!storage.replaceAllMatches(merged)) throw new Error("save-failed");

  if (Array.isArray(data.favoritePlayers)) {
    const merged = [...new Set([...getFavoritePlayers(), ...data.favoritePlayers])];
    setFavoritePlayers(merged);
  }

  // Profil (główny zawodnik, strona guzika): z pliku tylko na urządzeniu, które
  // jeszcze nie przeszło konfiguracji, żeby nie nadpisać bieżących ustawień.
  if (data.profile && typeof data.profile === "object" && data.profile.done && !getProfile().done) {
    saveProfile(data.profile);
  }

  // Rywalizacje drużynowe scalane po id, tak samo jak mecze — te z pliku
  // nadpisują te lokalne o tym samym id, reszta zostaje bez zmian.
  if (Array.isArray(data.teamTies)) {
    const currentTies = listTeamTies();
    const tieById = new Map(currentTies.map((tie) => [tie.id, tie]));
    for (const tie of data.teamTies) {
      if (tie && tie.id) tieById.set(tie.id, tie);
    }
    replaceAllTeamTies([...tieById.values()]);
  }

  return { matchCount: byId.size, skipped };
}
