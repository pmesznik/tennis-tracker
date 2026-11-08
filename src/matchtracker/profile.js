// Tennis Tracker — profil użytkownika ze strony startowej: imię głównego
// zawodnika, strona jego guzika w meczu i tryb „zapisuję mecze innych osób".
import { normName } from "./nameKey.js";

const KEY = "tt_profile";

export function getProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null");
    if (p && typeof p === "object") {
      return { name: String(p.name || ""), side: p.side === "left" ? "left" : "right", done: !!p.done };
    }
  } catch {}
  return { name: "", side: "right", done: false };
}

export function saveProfile(p) {
  const clean = { name: String(p.name || "").trim(), side: p.side === "left" ? "left" : "right", done: true };
  try { localStorage.setItem(KEY, JSON.stringify(clean)); } catch {}
  return clean;
}

// Imię do greeting: pierwszy człon wpisanego nazwiska.
export function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

// Mecz „innych osób" = taki, w którym główny zawodnik nie gra.
export function isOthersMatch(profile, match) {
  if (!profile?.name) return false;
  const key = normName(profile.name);
  return ![...(match.team1?.names || []), ...(match.team2?.names || [])].some((n) => normName(n) === key);
}

// Czy w tym meczu guziki trzeba zamienić miejscami, żeby główny zawodnik
// był po wybranej stronie? Domyślnie drużyna 1 jest po lewej, 2 po prawej.
export function shouldSwapSides(profile, match) {
  if (!profile?.name || !match) return false;
  const key = normName(profile.name);
  const in1 = (match.team1?.names || []).some((n) => normName(n) === key);
  const in2 = (match.team2?.names || []).some((n) => normName(n) === key);
  if (in1 === in2) return false;
  if (in1) return profile.side === "right";
  return profile.side === "left";
}
