// Tennis Tracker — okienka ekranu meczu na żywo: poprawa imion i nazwisk oraz
// wybór decydującego seta (pełny set albo super tie-break) po wyniku 1:1.
import { useState, useEffect } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang } from "../i18n.js";
import { pushBack } from "../backStack.js";
import { Icon } from "./ui.jsx";

function Sheet({ title, onClose, children }) {
  const { t } = useThemeCtx();
  useEffect(() => (onClose ? pushBack(onClose) : undefined), []);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400, background: t.overlay,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div role="dialog" aria-label={title} style={{
        background: t.bg, border: `1px solid ${t.glassLine}`, borderRadius: `${t.rLg}px ${t.rLg}px 0 0`,
        maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto",
        padding: "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))", boxShadow: t.elevFloat,
      }} onClick={(e) => e.stopPropagation()}>
        <div aria-hidden="true" style={{ width: 42, height: 5, borderRadius: 3, background: t.borderStrong, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// Przycisk z ołówkiem do paska tytułowego meczu.
export function EditNamesButton({ onClick }) {
  const { t } = useThemeCtx();
  const { t: tr } = useLang();
  return (
    <button onClick={onClick} aria-label={tr("tracker.editNames")} title={tr("tracker.editNames")} style={{
      width: 40, height: 40, borderRadius: "50%", border: "none", flexShrink: 0,
      background: t.tonal, color: t.text, cursor: "pointer", display: "grid", placeItems: "center", padding: 0,
    }}><Icon name="edit" size={19} /></button>
  );
}

/**
 * @param {{team1:string[], team2:string[]}} names obecne nazwiska
 * @param onSave (team1Names[], team2Names[]) => void
 */
export function EditNamesModal({ names, onSave, onClose }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const [t1, setT1] = useState(names.team1);
  const [t2, setT2] = useState(names.team2);
  const setAt = (arr, set, i, v) => set(arr.map((x, idx) => (idx === i ? v : x)));
  const field = (arr, set, i, label) => (
    <input key={label + i} style={{ ...styles.input, marginBottom: 8 }} value={arr[i]} aria-label={label}
      onChange={(e) => setAt(arr, set, i, e.target.value)} placeholder={tr("common.fullName")} />
  );
  return (
    <Sheet title={tr("tracker.editNames")} onClose={onClose}>
      <div style={{ fontSize: 12, color: t.textSub, marginBottom: 14, lineHeight: 1.45 }}>{tr("tracker.editNamesHint")}</div>
      <span style={styles.label}>{tr("setup.team1")}</span>
      {t1.map((_, i) => field(t1, setT1, i, `${tr("setup.team1")} ${i + 1}`))}
      <span style={{ ...styles.label, marginTop: 10, display: "block" }}>{tr("setup.team2")}</span>
      {t2.map((_, i) => field(t2, setT2, i, `${tr("setup.team2")} ${i + 1}`))}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button style={{ ...styles.secondaryBtn, flex: 1 }} onClick={onClose}>{tr("common.cancel")}</button>
        <button style={{ ...styles.primaryBtn, flex: 1 }} onClick={() => onSave(t1, t2)}>{tr("common.save")}</button>
      </div>
    </Sheet>
  );
}

// Po 1:1 w setach (mecz do dwóch wygranych setów): trzeci set pełny albo
// super tie-break do 10. Okienko blokuje wpisywanie punktów, dopóki gracz nie wybierze.
export function FinalSetModal({ superTb, superTo, onPick }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const Option = ({ value, title, desc }) => (
    <button onClick={() => onPick(value)} style={{
      width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginBottom: 10,
      border: `2px solid ${superTb === value ? t.accent : t.borderStrong}`,
      background: superTb === value ? `${t.accent}18` : t.surfaceElevated,
      borderRadius: t.rMd, padding: 14, color: t.text, minHeight: 64,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: superTb === value ? t.accent : t.text }}>{title}</div>
      <div style={{ fontSize: 12, color: t.textSub, marginTop: 4 }}>{desc}</div>
    </button>
  );
  return (
    <Sheet title={tr("tracker.finalSetTitle")}>
      <div style={{ fontSize: 13, color: t.textSub, marginBottom: 14, lineHeight: 1.45 }}>{tr("tracker.finalSetHint")}</div>
      <Option value={false} title={tr("tracker.finalSetFull")} desc={tr("tracker.finalSetFullDesc")} />
      <Option value={true} title={tr("tracker.finalSetSuper", { n: superTo })} desc={tr("tracker.finalSetSuperDesc", { n: superTo })} />
    </Sheet>
  );
}
