// Tennis Tracker — sprawdzanie i instalowanie aktualizacji z GitHub Releases.
// Działa tylko w aplikacji na Androidzie (w przeglądarce nic nie robi).
// Numer wydania `vNN` jest tym samym, co versionCode zbudowanego APK.
import { registerPlugin } from "@capacitor/core";

const Updater = registerPlugin("Updater");
const RELEASES_API = "https://api.github.com/repos/pmesznik/tennis-tracker/releases/latest";

export function isNative() {
  return !!(typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.());
}

// Zwraca { tag, number, url, current } gdy jest nowsze wydanie, w przeciwnym razie null.
export async function checkForUpdate() {
  if (!isNative()) return null;
  try {
    const { versionCode } = await Updater.getVersionCode();
    const res = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return null;
    const rel = await res.json();
    const number = parseInt(String(rel.tag_name || "").replace(/\D/g, ""), 10);
    const asset = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
    if (!number || !asset || number <= versionCode) return null;
    return { tag: rel.tag_name, number, url: asset.browser_download_url, current: versionCode };
  } catch {
    return null;
  }
}

// Pobiera APK i uruchamia instalator. onProgress(percent). Zwraca "started" albo "needsPermission".
export async function installUpdate(url, onProgress) {
  const handle = onProgress ? await Updater.addListener("progress", (e) => onProgress(e.percent)) : null;
  try {
    const r = await Updater.install({ url });
    return r.needsPermission ? "needsPermission" : "started";
  } finally {
    handle?.remove?.();
  }
}
