// Pasek "Dostępna nowa wersja" na liście meczów. Sprawdza GitHub Releases raz
// przy starcie; "Później" ukrywa pasek do następnego wydania.
import { useEffect, useState } from "react";
import { useThemeCtx } from "./theme.js";
import { useLang } from "./i18n.js";
import { checkForUpdate, installUpdate } from "./updater.js";

const DISMISS_KEY = "atz_update_dismissed";

export default function UpdateBanner() {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const [upd, setUpd] = useState(null);
  const [state, setState] = useState({ phase: "idle", percent: 0 });

  useEffect(() => {
    let alive = true;
    checkForUpdate().then((u) => {
      if (!alive || !u) return;
      try { if (localStorage.getItem(DISMISS_KEY) === u.tag) return; } catch {}
      setUpd(u);
    });
    return () => { alive = false; };
  }, []);

  if (!upd) return null;

  const start = async () => {
    setState({ phase: "downloading", percent: 0 });
    try {
      const r = await installUpdate(upd.url, (percent) => setState({ phase: "downloading", percent }));
      setState({ phase: r === "needsPermission" ? "permission" : "done", percent: 100 });
    } catch {
      setState({ phase: "error", percent: 0 });
    }
  };
  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, upd.tag); } catch {}
    setUpd(null);
  };

  const busy = state.phase === "downloading";
  const msg = state.phase === "downloading" ? tr("update.downloading", { n: state.percent })
    : state.phase === "permission" ? tr("update.permission")
    : state.phase === "done" ? tr("update.done")
    : state.phase === "error" ? tr("update.error")
    : tr("update.available", { tag: upd.tag });

  return (
    <div role="status" style={{
      margin: "0 16px 12px", padding: "12px 14px", borderRadius: t.rCard, background: t.tonal,
      border: `1px solid ${t.accent}55`, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ fontSize: 14, fontWeight: 650, color: t.text }}>{msg}</div>
      {busy && (
        <div style={{ height: 5, borderRadius: 3, background: t.border, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${state.percent}%`, background: t.accent, transition: "width .2s" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...styles.primaryBtn, minHeight: 40, fontSize: 14 }} disabled={busy} onClick={start}>
          {state.phase === "error" || state.phase === "permission" ? tr("update.retry") : tr("update.install")}
        </button>
        <button style={{ ...styles.secondaryBtn, minHeight: 40, fontSize: 14 }} disabled={busy} onClick={dismiss}>{tr("update.later")}</button>
      </div>
    </div>
  );
}
