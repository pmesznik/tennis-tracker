// Tennis Tracker — okienko eksportu/importu kopii zapasowej historii meczów.
import { useRef, useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang } from "../i18n.js";
import { Icon } from "./ui.jsx";
import { exportBackup, importBackupFile } from "./backup.js";
import {
  isNative, getCloudConfig, saveCloudConfig, pickCloudFolder, clearCloudFolder, runCloudBackup,
  FREQUENCIES, NEWEST_FILE, PREVIOUS_FILE,
} from "../cloudBackup.js";

// Sekcja kopii w chmurze: folder wybrany w telefonie + częstotliwość.
function CloudSection({ t, styles, tr }) {
  const [cfg, setCfg] = useState(() => getCloudConfig());
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const native = isNative();
  const pick = async () => {
    try { const c = await pickCloudFolder(); if (c) { setCfg(c); setMsg(""); } }
    catch { setOk(false); setMsg(tr("cloud.pickError")); }
  };
  const now = async () => {
    setBusy(true); setMsg("");
    const r = await runCloudBackup();
    setCfg(getCloudConfig());
    setOk(r.ok);
    setMsg(r.ok ? tr("cloud.done") : tr(r.error === "folder-unavailable" ? "cloud.unavailable" : "cloud.failed"));
    setBusy(false);
  };
  const last = cfg.lastAt ? new Date(cfg.lastAt).toLocaleString() : tr("cloud.never");
  const errText = cfg.lastError ? tr(cfg.lastError === "folder-unavailable" ? "cloud.unavailable" : "cloud.failed") : "";
  return (
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${t.glassLine}` }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{tr("cloud.title")}</div>
      <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.45, marginBottom: 12 }}>
        {native ? tr("cloud.hint", { newest: NEWEST_FILE, previous: PREVIOUS_FILE }) : tr("cloud.onlyApp")}
      </div>
      {native && (
        <>
          <button onClick={pick} style={{ ...styles.secondaryBtn, marginBottom: 10 }}>
            <Icon name="upload" size={19} />{cfg.uri ? tr("cloud.changeFolder") : tr("cloud.pickFolder")}
          </button>
          {cfg.uri && (
            <>
              <div style={{ fontSize: 13, marginBottom: 10 }}>
                <b>{tr("cloud.folder")}:</b> {cfg.folderName || "…"}
              </div>
              <span style={styles.label}>{tr("cloud.freqLabel")}</span>
              <div role="group" aria-label={tr("cloud.freqLabel")} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {FREQUENCIES.map((f) => (
                  <button key={f} aria-pressed={cfg.freq === f} onClick={() => setCfg(saveCloudConfig({ freq: f }))} style={{
                    minHeight: 40, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5,
                    border: `1px solid ${cfg.freq === f ? t.accent : t.glassLine}`,
                    background: cfg.freq === f ? t.tonalStrong : "transparent", color: t.text, fontWeight: cfg.freq === f ? 700 : 500,
                  }}>{tr("cloud.freq." + f)}</button>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: t.textSub, marginBottom: 10 }}>{tr("cloud.last")}: {last}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={now} disabled={busy} style={{ ...styles.primaryBtn, flex: 1, opacity: busy ? 0.6 : 1 }}>
                  {busy ? tr("cloud.saving") : tr("cloud.now")}
                </button>
                <button onClick={() => setCfg(clearCloudFolder())} style={{ ...styles.secondaryBtn, flex: "0 0 auto", padding: "0 16px" }}>{tr("cloud.off")}</button>
              </div>
            </>
          )}
          {(msg || errText) && <div role="status" style={{ fontSize: 12.5, marginTop: 10, color: msg && ok ? t.accent : t.danger }}>{msg || errText}</div>}
        </>
      )}
    </div>
  );
}


export default function BackupModal({ onClose, onImported }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // pozwala wybrać ten sam plik jeszcze raz później
    if (!file) return;
    setBusy(true);
    try {
      const { matchCount, skipped } = await importBackupFile(file);
      alert(tr("backup.importSuccess", { n: matchCount }) + (skipped ? " " + tr("backup.skipped", { n: skipped }) : ""));
      onImported?.();
      onClose();
    } catch {
      alert(tr("backup.importError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400, background: t.overlay,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div role="dialog" aria-label={tr("backup.title")} style={{
        background: t.bg, border: `1px solid ${t.glassLine}`, borderRadius: `${t.rLg}px ${t.rLg}px 0 0`,
        maxWidth: 480, width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))",
        boxShadow: t.elevFloat,
      }} onClick={(e) => e.stopPropagation()}>
        <div aria-hidden="true" style={{ width: 42, height: 5, borderRadius: 3, background: t.borderStrong, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: t.tonal, color: t.accent, display: "grid", placeItems: "center" }}>
            <Icon name="save" size={22} />
          </span>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{tr("backup.title")}</div>
        </div>
        <div style={{ fontSize: 13.5, color: t.textSub, margin: "6px 0 16px", lineHeight: 1.45 }}>{tr("backup.hint")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={exportBackup} style={styles.primaryBtn}>
            <Icon name="download" size={21} />{tr("backup.export")}
          </button>
          <button onClick={handleImportClick} disabled={busy} style={{ ...styles.secondaryBtn, opacity: busy ? 0.6 : 1 }}>
            <Icon name="upload" size={20} />{busy ? tr("backup.importing") : tr("backup.import")}
          </button>
        </div>
        <CloudSection t={t} styles={styles} tr={tr} />
        <input
          ref={fileInputRef} type="file" accept="application/json,.json"
          style={{ display: "none" }} onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
