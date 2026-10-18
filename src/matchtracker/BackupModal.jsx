// Tennis Tracker — okienko eksportu/importu kopii zapasowej historii meczów.
import { useRef, useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang } from "../i18n.js";
import { Icon } from "./ui.jsx";
import { exportBackup, importBackupFile } from "./backup.js";

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
      const { matchCount } = await importBackupFile(file);
      alert(tr("backup.importSuccess", { n: matchCount }));
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
        maxWidth: 480, width: "100%", padding: "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))",
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
        <input
          ref={fileInputRef} type="file" accept="application/json,.json"
          style={{ display: "none" }} onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
