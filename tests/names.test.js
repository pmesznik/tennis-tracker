import { describe, it, expect } from "vitest";
import { normName, sameName } from "../src/matchtracker/nameKey.js";
import { buildPlayerIndex, suggestOpponents, canonicalName } from "../src/matchtracker/players.js";
import { computeH2H } from "../src/matchtracker/h2h.js";
import { computeScore, PRESETS } from "../src/matchtracker/scoringEngine.js";
import { match, gamesLog, setSpec } from "./helpers.js";

describe("nazwiska bez znaczenia kolejności", () => {
  it("imię nazwisko = nazwisko imię, wielkość liter, ogonki i spacje", () => {
    expect(normName("Jan Kowalski")).toBe(normName("kowalski   jan"));
    expect(normName("Łukasz Żółć")).toBe(normName("ZOLC lukasz"));
    expect(sameName("Jan Kowalski", "Kowalski Jan")).toBe(true);
    expect(sameName("Jan Kowalski", "Jan Nowak")).toBe(false);
    expect(sameName("", "")).toBe(false);
  });

  it("indeks graczy łączy zapisy i podpowiada jeden zapis", () => {
    const ms = [
      match({ team1: { names: ["Jan Kowalski"] }, team2: { names: ["Ola Nowak"] } }),
      match({ team1: { names: ["Kowalski Jan"] }, team2: { names: ["Ola Nowak"] } }),
      match({ team1: { names: ["Jan Kowalski"] }, team2: { names: ["Ola Nowak"] } }),
    ];
    const idx = buildPlayerIndex(ms);
    expect(idx.allNames).toEqual(["Jan Kowalski", "Ola Nowak"]);
    expect(suggestOpponents(idx, "Nowak Ola")).toEqual(["Jan Kowalski"]);
    expect(canonicalName(idx, "  kowalski   Jan ")).toBe("Jan Kowalski");
    expect(canonicalName(idx, "Ktoś Nowy")).toBe("Ktoś Nowy");
  });

  it("H2H liczy mecze obu zapisów jako jedną parę", () => {
    const wins = [...setSpec("team1", "team2", 6, 0), ...setSpec("team1", "team2", 6, 0)];
    const ms = [
      match({ team1: { names: ["Jan Kowalski"] }, team2: { names: ["Ola Nowak"] }, pointLog: gamesLog(wins) }),
      match({ id: "x", team1: { names: ["Nowak Ola"] }, team2: { names: ["Kowalski Jan"] }, pointLog: gamesLog(wins.map(() => "team2")) }),
    ];
    const h = computeH2H(ms, "Jan Kowalski", "Ola Nowak");
    expect(h.total).toBe(2);
    expect(h.a.matchesWon).toBe(2);
  });
});

describe("decydujący set wybierany po 1:1", () => {
  const base = PRESETS.best_of_3_tb;
  const sets11 = () => [
    ...gamesLog(setSpec("team1", "team2", 6, 0)),
    ...gamesLog(setSpec("team2", "team1", 6, 0)),
  ];

  it("ten sam przebieg 1:1 jako pełny set albo super tie-break", () => {
    const full = computeScore({ ...base, finalSetSuperTiebreak: false }, sets11());
    const sup = computeScore({ ...base, finalSetSuperTiebreak: true }, sets11());
    expect(full.setsWonA).toBe(1);
    expect(sup.game.isSuperTiebreak).toBe(true);
    expect(full.game.isSuperTiebreak).toBe(false);
    expect(full.game.a).toBe("0");
    expect(sup.game.a).toBe("0");
  });
});
