// Tennis Tracker v0.2.0 — lista meczów (ekran startowy).
import { useState } from "react";
import { useThemeCtx } from "../theme.js";
import { useLang, surfaceLabel } from "../i18n.js";
import { Card, ShareIcon, Icon, TennisBall } from "./ui.jsx";
import * as storage from "./storage.js";
import { computeScore, buildSetRow, teamLabel } from "./scoringEngine.js";
import { shareMatch, buildShareUrl } from "./shareLink.js";
import { clearLiveScore } from "./liveSync.js";
import { removeMatchFromTie } from "./teamTies.js";

function matchSetsRow(match) {
  if (match.status === "completed" && match.finalSetsOverride) {
    return match.finalSetsOverride.map((s) =>
      s.isSuperTiebreak ? `[${s.a}-${s.b}]` : s.tiebreak ? `${s.a}-${s.b}(${Math.min(s.tiebreak.a, s.tiebreak.b)})` : `${s.a}-${s.b}`
    );
  }
  const score = computeScore(match.rules, match.pointLog, match.initialServer || "team1");
  return buildSetRow(match.rules, score);
}

function MatchCard({ match, onOpen, onDelete }) {
  const { t } = useThemeCtx();
  const { lang, t: tr } = useLang();
  const name1 = teamLabel("team1", match.team1.names, match.team2.names, tr("common.player1"), tr("common.player2"));
  const name2 = teamLabel("team2", match.team1.names, match.team2.names, tr("common.player1"), tr("common.player2"));
  const sets = matchSetsRow(match);
  const iconBtn = {
    minWidth: 44, minHeight: 44, padding: 0, border: "none", background: "transparent",
    borderRadius: 12, cursor: "pointer", display: "grid", placeItems: "center", color: t.textSub,
  };
  return (
    <Card>
      <div style={{ padding: "14px 8px 6px 16px", cursor: "pointer" }} onClick={() => onOpen(match)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingRight: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 650, flex: 1, lineHeight: 1.3 }}>
            {name1} <span style={{ color: t.textMuted, fontWeight: 500 }}>–</span> {name2}
          </div>
          {match.status === "in_progress" && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
              fontSize: 11.5, fontWeight: 650, letterSpacing: "0.04em", textTransform: "uppercase",
              background: "rgba(16,185,129,0.16)", color: "#34d399",
              padding: "4px 10px", borderRadius: 999,
            }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
              {tr("list.inProgress")}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 22, fontWeight: 700, color: t.text, marginTop: 8, display: "flex", gap: 14,
          fontFamily: t.fontScore, letterSpacing: "0.01em",
        }}>
          {sets.map((s, i) => <span key={i}>{s}</span>)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: t.textSub }}>
            <Icon name="calendar" size={15} />{match.date}{match.surface ? ` · ${surfaceLabel(lang, match.surface)}` : ""}
          </span>
          <div style={{ display: "flex", gap: 0 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                shareMatch(`${name1} – ${name2}: ${sets.join(" ")}`, buildShareUrl(match, sets));
              }}
              style={iconBtn}
              aria-label={tr("common.share")} title={tr("common.share")}
            ><ShareIcon size={19} /></button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(tr("common.confirmDeleteMatch"))) onDelete(match.id); }}
              style={iconBtn}
              aria-label={tr("common.delete")} title={tr("common.delete")}
            ><Icon name="trash" size={19} /></button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MatchListPage({ onNewMatch, onSaveResult, onOpenMatch }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const [matches, setMatches] = useState(() => storage.listMatches());

  const refresh = () => setMatches(storage.listMatches());

  const handleDelete = (id) => {
    const match = storage.getMatch(id);
    storage.deleteMatch(id);
    clearLiveScore(id);
    if (match?.teamTieId) removeMatchFromTie(match.teamTieId, id);
    refresh();
  };

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button style={styles.primaryBtn} onClick={onNewMatch}><Icon name="add" size={22} />{tr("list.newMatch")}</button>
        <button style={styles.secondaryBtn} onClick={onSaveResult}><Icon name="edit" size={19} />{tr("list.saveResult")}</button>
      </div>

      {matches.length === 0 ? (
        <div style={styles.centered}>
          <span style={{
            width: 72, height: 72, borderRadius: 24, background: t.tonal, display: "grid", placeItems: "center",
          }}><TennisBall size={40} /></span>
          <span style={{ fontSize: 16, fontWeight: 650, color: t.text }}>{tr("list.emptyTitle")}</span>
          <span style={{ fontSize: 13, maxWidth: 260 }}>{tr("list.emptyHint")}</span>
        </div>
      ) : (
        matches.map((m) => (
          <MatchCard key={m.id} match={m} onOpen={onOpenMatch} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
}
