// Tennis Tracker — kopia zapasowa w chmurze przez folder wskazany w telefonie.
// Użytkownik raz wybiera folder (np. w Dysku Google, Dropboksie, OneDrive) w
// systemowym oknie, a aplikacja zapisuje tam dwa pliki: najnowszy i poprzedni.
// Częstotliwość: po każdym meczu, codziennie, co tydzień albo tylko ręcznie.
import { registerPlugin } from "@capacitor/core";
import { buildBackupData } from "./matchtracker/backup.js";
import * as storage from "./matchtracker/storage.js";

const CloudBackup = registerPlugin("CloudBackup");
const KEY = "tt_cloud_backup";
export const NEWEST_FILE = "tennis-tracker-kopia-najnowsza.json";
export const PREVIOUS_FILE = "tennis-tracker-kopia-poprzednia.json";
export const FREQUENCIES = ["match", "daily", "weekly", "manual"];
const DAY = 24 * 60 * 60 * 1000;

export function isNative() {
  return !!(typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.());
}

export function getCloudConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    if (c && typeof c === "object") {
      return {
        uri: typeof c.uri === "string" ? c.uri : "", folderName: String(c.folderName || ""),
        freq: FREQUENCIES.includes(c.freq) ? c.freq : "daily",
        lastAt: Number(c.lastAt) || 0, lastSig: String(c.lastSig || ""), lastError: String(c.lastError || ""),
      };
    }
  } catch {}
  return { uri: "", folderName: "", freq: "daily", lastAt: 0, lastSig: "", lastError: "" };
}

export function saveCloudConfig(patch) {
  const next = { ...getCloudConfig(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

// Podpis stanu danych: zmienia się po dodaniu, edycji lub usunięciu meczu.
export function dataSignature(matches = storage.listMatches()) {
  let max = "";
  for (const m of matches) { const u = String(m.updatedAt || m.createdAt || ""); if (u > max) max = u; }
  return `${matches.length}:${max}`;
}

// Czy trzeba teraz zrobić kopię automatyczną? Zawsze tylko gdy dane się
// zmieniły od ostatniej kopii (inaczej „poprzednia” byłaby kopią identyczną z
// najnowszą i stara wersja by przepadła).
export function isBackupDue(cfg, now, sig) {
  if (!cfg.uri || cfg.freq === "manual") return false;
  if (!sig || sig === "0:" || sig === cfg.lastSig) return false;
  if (cfg.freq === "match") return true;
  const every = cfg.freq === "weekly" ? 7 * DAY : DAY;
  return !cfg.lastAt || now - cfg.lastAt >= every;
}

export async function pickCloudFolder() {
  const r = await CloudBackup.pickFolder();
  if (r.cancelled) return null;
  return saveCloudConfig({ uri: r.uri, folderName: r.name || "", lastError: "" });
}

export function clearCloudFolder() {
  return saveCloudConfig({ uri: "", folderName: "", lastError: "" });
}

// Zapisuje kopię teraz. Zwraca { ok, error? }.
export async function runCloudBackup() {
  const cfg = getCloudConfig();
  if (!isNative() || !cfg.uri) return { ok: false, error: "no-folder" };
  try {
    const matches = storage.listMatches();
    await CloudBackup.write({
      uri: cfg.uri, newest: NEWEST_FILE, previous: PREVIOUS_FILE,
      content: JSON.stringify(buildBackupData(), null, 2),
    });
    saveCloudConfig({ lastAt: Date.now(), lastSig: dataSignature(matches), lastError: "" });
    return { ok: true };
  } catch (e) {
    const error = String(e?.message || e || "error");
    saveCloudConfig({ lastError: error });
    return { ok: false, error };
  }
}

let running = false;
// Wywoływane przy starcie, powrocie do aplikacji i po zakończeniu meczu.
export async function maybeAutoBackup() {
  if (running || !isNative()) return;
  const cfg = getCloudConfig();
  if (!isBackupDue(cfg, Date.now(), dataSignature())) return;
  running = true;
  try { await runCloudBackup(); } finally { running = false; }
}
