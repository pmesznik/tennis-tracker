// Tennis Tracker — okno „Mecze innych osób": nowy mecz z pustymi nazwiskami,
// statystyki i historia meczów, w których nie gra główny zawodnik.
import { useThemeCtx } from "../theme.js";
import { useLang } from "../i18n.js";
import { TopBar, FullScreen, ScrollBody, Icon } from "./ui.jsx";
import MatchListPage from "./MatchListPage.jsx";
import { getProfile, isOthersMatch } from "./profile.js";

export default function OthersPage({ onBack, onNewMatch, onSaveResult, onStats, onOpenMatch }) {
  const { t, styles } = useThemeCtx();
  const { t: tr } = useLang();
  const profile = getProfile();
  return (
    <FullScreen>
      <TopBar title={tr("others.title")} onBack={onBack} />
      <ScrollBody>
        <MatchListPage
          onNewMatch={onNewMatch}
          onSaveResult={onSaveResult}
          onOpenMatch={onOpenMatch}
          filter={(m) => isOthersMatch(profile, m)}
          extra={
            <>
              <button style={{ ...styles.secondaryBtn, marginBottom: 12 }} onClick={onStats}>
                <Icon name="stats" size={19} />{tr("others.stats")}
              </button>
              <div style={{ fontSize: 12.5, color: t.textSub, marginBottom: 14 }}>{tr("others.hint")}</div>
            </>
          }
        />
      </ScrollBody>
    </FullScreen>
  );
}
