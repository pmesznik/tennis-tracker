// Tennis Tracker — strona startowa: konfiguracja przy pierwszym uruchomieniu
// (imię głównego zawodnika, strona jego guzika), potem powitanie ze skrótami.
import { useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang } from "../i18n.js";
import { Icon } from "./ui.jsx";
import * as storage from "./storage.js";
import { teamLabel } from "./scoringEngine.js";
import { getProfile, saveProfile, firstName } from "./profile.js";
import { buildPlayerIndex } from "./players.js";
import appIcon from "../assets/app-icon.svg";

function Seg({ t, options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} style={{ display: "flex", gap: 4, padding: 3, background: t.tonal, borderRadius: 999, marginBottom: 16 }}>
      {options.map(([val, text]) => (
        <button key={String(val)} onClick={() => onChange(val)} aria-pressed={value === val} style={{
          flex: 1, minHeight: 42, padding: "8px 6px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
          background: value === val ? t.tonalStrong : "transparent", color: value === val ? t.text : t.textSub,
          fontWeight: value === val ? 700 : 500, fontSize: 14,
        }}>{text}</button>
      ))}
    </div>
  );
}

export default function StartPage({ editing, onDone, onNewMatch, onHistory, onStats, onMyStats, onOpenMatch }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const [profile, setProfile] = useState(() => getProfile());
  const [configOpen, setConfigOpen] = useState(!!editing || !getProfile().done);
  const [draft, setDraft] = useState(profile);
  const known = buildPlayerIndex(storage.listMatches()).allNames;

  const header = (
    <div style={{ textAlign: "center", padding: "28px 0 18px" }}>
      <img src={appIcon} width={88} height={88} alt="" style={{ borderRadius: 24, boxShadow: t.elevFloat }} />
    </div>
  );

  if (configOpen) {
    const first = !profile.done;
    const save = () => {
      setProfile(saveProfile(draft));
      setConfigOpen(false);
      onDone?.();
    };
    return (
      <div style={styles.page}>
        {header}
        <div style={{ fontSize: 22, fontWeight: 750, textAlign: "center", marginBottom: 6 }}>{tr(first ? "start.welcome" : "start.settings")}</div>
        <div style={{ fontSize: 13.5, color: t.textSub, textAlign: "center", lineHeight: 1.45, marginBottom: 22 }}>{tr("start.hint")}</div>
        <span style={styles.label}>{tr("start.nameLabel")}</span>
        <datalist id="start-known">{known.map((n) => <option key={n} value={n} />)}</datalist>
        <input style={{ ...styles.input, marginBottom: 16 }} list="start-known" value={draft.name} placeholder={tr("common.fullName")}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <span style={styles.label}>{tr("start.sideLabel")}</span>
        <Seg t={t} label={tr("start.sideLabel")} value={draft.side} onChange={(side) => setDraft({ ...draft, side })}
          options={[["left", tr("start.sideLeft")], ["right", tr("start.sideRight")]]} />
        <span style={styles.label}>{tr("start.modeLabel")}</span>
        <Seg t={t} label={tr("start.modeLabel")} value={draft.others} onChange={(others) => setDraft({ ...draft, others })}
          options={[[false, tr("start.modeMine")], [true, tr("start.modeOthers")]]} />
        <div style={{ fontSize: 12.5, color: t.textSub, lineHeight: 1.45, marginBottom: 20 }}>{tr("start.modeHint")}</div>
        <button style={styles.primaryBtn} onClick={save}>{tr(first ? "start.begin" : "common.save")}</button>
        {!first && <button style={{ ...styles.secondaryBtn, marginTop: 10 }} onClick={() => { setDraft(profile); setConfigOpen(false); }}>{tr("common.cancel")}</button>}
      </div>
    );
  }

  const last = storage.listMatches()[0];
  const lastName = last && `${teamLabel("team1", last.team1.names, last.team2.names, tr("common.player1"), tr("common.player2"))} – ${teamLabel("team2", last.team1.names, last.team2.names, tr("common.player1"), tr("common.player2"))}`;
  const toggleOthers = () => setProfile(saveProfile({ ...profile, others: !profile.others }));
  const fn = firstName(profile.name);

  return (
    <div style={styles.page}>
      {header}
      <div style={{ fontSize: 24, fontWeight: 750, textAlign: "center", marginBottom: 4 }}>
        {fn ? tr("start.hello", { name: fn }) : tr("start.helloNoName")}
      </div>
      <div style={{ fontSize: 13.5, color: t.textSub, textAlign: "center", marginBottom: 22 }}>
        {tr(profile.others ? "start.nowOthers" : "start.nowMine")}
      </div>
      <button style={styles.primaryBtn} onClick={onNewMatch}><Icon name="add" size={22} />{tr("list.newMatch")}</button>
      <div style={{ display: "flex", gap: 10, margin: "10px 0 16px" }}>
        <button style={styles.secondaryBtn} onClick={onHistory}><Icon name="calendar" size={19} />{tr("start.history")}</button>
        <button style={styles.secondaryBtn} onClick={onStats}><Icon name="stats" size={19} />{tr("start.stats")}</button>
      </div>
      {profile.name && (
        <button style={{ ...styles.secondaryBtn, marginBottom: 16 }} onClick={() => onMyStats(profile.name)}>
          <Icon name="stats" size={19} />{tr("start.myStats")}
        </button>
      )}
      {last && (
        <button onClick={() => onOpenMatch(last)} style={{
          display: "block", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: t.text,
          background: t.surface, border: `1px solid ${t.glassLine}`, borderRadius: t.rMd, padding: "12px 14px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {tr(last.status === "in_progress" ? "start.resume" : "start.lastMatch")}
          </div>
          <div style={{ fontSize: 16, fontWeight: 650, marginTop: 4 }}>{lastName}</div>
          <div style={{ fontSize: 12.5, color: t.textSub, marginTop: 2 }}>{last.date}</div>
        </button>
      )}
      <div style={{ background: t.tonal, borderRadius: t.rMd, padding: "12px 14px", fontSize: 13, color: t.textSub, lineHeight: 1.5 }}>
        <div style={{ marginBottom: 10 }}>{tr("start.reminder")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.secondaryBtn, fontSize: 13 }} onClick={() => { setDraft(profile); setConfigOpen(true); }}>
            <Icon name="edit" size={17} />{tr("start.changeSettings")}
          </button>
          <button style={{ ...styles.secondaryBtn, fontSize: 13 }} onClick={toggleOthers}>
            {tr(profile.others ? "start.switchToMine" : "start.switchToOthers")}
          </button>
        </div>
      </div>
    </div>
  );
}
