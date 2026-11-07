// Tennis Tracker — okienka ekranu meczu na żywo: poprawa imion i nazwisk oraz
// wybór decydującego seta (pełny set albo super tie-break) po wyniku 1:1.
import { useState, useEffect } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang } from "../i18n.js";
import { pushBack } from "../backStack.js";
import { Icon, Chip } from "./ui.jsx";

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

// Jeden przycisk "więcej" w pasku meczu zamiast kilku małych (ołówek, flaga).
export function MoreButton({ onClick }) {
  const { t } = useThemeCtx();
  const { t: tr } = useLang();
  return (
    <button onClick={onClick} aria-label={tr("tracker.options")} title={tr("tracker.options")} style={{
      width: 40, height: 40, borderRadius: "50%", border: "none", flexShrink: 0,
      background: t.tonal, color: t.text, cursor: "pointer", display: "grid", placeItems: "center", padding: 0,
    }}><Icon name="more" size={20} /></button>
  );
}

export function MatchOptionsModal({ onEditNames, onEndEarly, onSwapServer, onClose }) {
  const { t } = useThemeCtx();
  const { t: tr } = useLang();
  const Row = ({ icon, label, desc, onClick }) => (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
      border: `1px solid ${t.borderStrong}`, background: t.surfaceElevated, borderRadius: t.rMd,
      padding: "12px 14px", marginBottom: 10, minHeight: 64, color: t.text,
    }}>
      <Icon name={icon} size={22} />
      <span>
        <span style={{ display: "block", fontSize: 15, fontWeight: 650 }}>{label}</span>
        <span style={{ display: "block", fontSize: 12, color: t.textSub, marginTop: 2 }}>{desc}</span>
      </span>
    </button>
  );
  return (
    <Sheet title={tr("tracker.options")} onClose={onClose}>
      <Row icon="edit" label={tr("tracker.editNames")} desc={tr("tracker.editNamesShort")} onClick={onEditNames} />
      {onSwapServer && <Row icon="undo" label={tr("tracker.swapServer")} desc={tr("tracker.swapServerShort")} onClick={onSwapServer} />}
      <Row icon="flag" label={tr("tracker.endEarly")} desc={tr("tracker.endEarlyShort")} onClick={onEndEarly} />
    </Sheet>
  );
}

/**
 * @param labels { team1: string, team2: string } nazwy stron
 * @param onConfirm (reason, loserTeam) => void  — loserTeam to strona, która się wycofała / nie stawiła / została zdyskwalifikowana
 */
export function EndMatchModal({ labels, onConfirm, onClose }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const [reason, setReason] = useState("retired");
  const [loser, setLoser] = useState(null);
  const reasons = [
    ["retired", tr("tracker.reasonRetired")],
    ["walkover", tr("tracker.reasonWalkover")],
    ["disqualified", tr("tracker.reasonDisqualified")],
  ];
  const side = (team) => (
    <button key={team} onClick={() => setLoser(team)} style={{
      flex: 1, minHeight: 56, padding: "8px 10px", borderRadius: t.rMd, cursor: "pointer", fontFamily: "inherit",
      fontSize: 14, fontWeight: 700, color: loser === team ? t.accent : t.text,
      border: `2px solid ${loser === team ? t.accent : t.borderStrong}`,
      background: loser === team ? `${t.accent}18` : t.surfaceElevated,
    }}>{loser === team ? "✓ " : ""}{labels[team]}</button>
  );
  const winnerLabel = loser ? labels[loser === "team1" ? "team2" : "team1"] : null;
  return (
    <Sheet title={tr("tracker.endEarly")} onClose={onClose}>
      <span style={styles.label}>{tr("tracker.endReason")}</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        {reasons.map(([k, label]) => (
          <button key={k} onClick={() => setReason(k)} aria-pressed={reason === k} style={{
            minHeight: 40, padding: "8px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit",
            background: reason === k ? t.tonalStrong : t.tonal, color: reason === k ? t.text : t.textSub, fontWeight: reason === k ? 700 : 500, fontSize: 14,
          }}>{label}</button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: t.textSub, margin: "6px 0 14px", lineHeight: 1.45 }}>{tr(`tracker.reasonHint.${reason}`)}</div>
      <span style={styles.label}>{tr(`tracker.whoLoses.${reason}`)}</span>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>{side("team1")}{side("team2")}</div>
      {winnerLabel && <div style={{ fontSize: 13, color: t.textSub, marginBottom: 12 }}>{tr("tracker.winnerIs", { name: winnerLabel })}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ ...styles.secondaryBtn, flex: 1 }} onClick={onClose}>{tr("common.cancel")}</button>
        <button style={{ ...styles.primaryBtn, flex: 1, opacity: loser ? 1 : 0.45 }} disabled={!loser} onClick={() => onConfirm(reason, loser)}>{tr("tracker.endConfirm")}</button>
      </div>
    </Sheet>
  );
}

// Edytor ręcznie wpisanego wyniku (mecz z "Zapisz wynik"): sety, tie-break
// (punkty przegranego) i super tie-break przy trzecim secie.
export function EditScoreModal({ rows: initialRows, onSave, onClose }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const [rows, setRows] = useState(initialRows.length ? initialRows : [{ a: "", b: "", tb: "", superTb: false }]);
  const upd = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const inp = { ...styles.input, width: 56, textAlign: "center" };
  return (
    <Sheet title={tr("summary.editScore")} onClose={onClose}>
      <div style={{ fontSize: 12, color: t.textSub, lineHeight: 1.45, marginBottom: 14 }}>{tr("setup.manualHint")}</div>
      {rows.map((row, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: t.textMuted, width: 40 }}>{row.superTb ? "STB" : tr("common.setLabel", { n: i + 1 })}</span>
            <input style={inp} type="number" inputMode="numeric" value={row.a} onChange={(e) => upd(i, { a: e.target.value })} />
            <span>–</span>
            <input style={inp} type="number" inputMode="numeric" value={row.b} onChange={(e) => upd(i, { b: e.target.value })} />
            {!row.superTb && <input style={inp} type="number" inputMode="numeric" value={row.tb} onChange={(e) => upd(i, { tb: e.target.value })} placeholder={tr("setup.tbPlaceholder")} title={tr("setup.tbTitle")} />}
            <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} aria-label={tr("common.delete")} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", minWidth: 40, minHeight: 40, display: "grid", placeItems: "center" }}><Icon name="close" size={18} /></button>
          </div>
          {i >= 2 && (
            <div style={{ marginTop: 8, marginLeft: 48 }}>
              <Chip label={tr("setup.superTbRow")} active={row.superTb} onClick={() => upd(i, { superTb: !row.superTb, tb: "" })} />
            </div>
          )}
        </div>
      ))}
      {rows.length < 5 && (
        <button style={{ ...styles.secondaryBtn, marginBottom: 12 }} onClick={() => setRows((rs) => [...rs, { a: "", b: "", tb: "", superTb: false }])}>
          <Icon name="add" size={18} />{tr("setup.addSet")}
        </button>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ ...styles.secondaryBtn, flex: 1 }} onClick={onClose}>{tr("common.cancel")}</button>
        <button style={{ ...styles.primaryBtn, flex: 1 }} onClick={() => onSave(rows)}>{tr("common.save")}</button>
      </div>
    </Sheet>
  );
}
