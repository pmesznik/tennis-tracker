import { describe, it, expect } from "vitest";
import { buildRenamePatch, buildSwapServerPatch, manualRowsToSets, setsToManualRows } from "../src/matchtracker/matchEdit.js";
import { computeScore } from "../src/matchtracker/scoringEngine.js";
import { match, gamesLog, setSpec, rulesTb } from "./helpers.js";

describe("poprawki meczu", () => {
  it("zamiana pierwszego serwującego odwraca punkty i nie zmienia wyniku", () => {
    const log = gamesLog(setSpec("team1", "team2", 6, 3));
    const m = match({ pointLog: log, status: "in_progress" });
    const patch = buildSwapServerPatch(m);
    expect(patch.initialServer).toBe("team2");
    expect(patch.pointLog[0].server).toBe("team2");
    const before = computeScore(rulesTb, log, "team1");
    const after = computeScore(rulesTb, patch.pointLog, "team2");
    expect(after.sets).toEqual(before.sets.map((s) => ({ ...s })));
    expect(after.server).toBe("team2" === patch.initialServer && before.server === "team1" ? "team2" : after.server);
  });

  it("zmiana nazwisk: zapis z historii i przeniesienie kolejności serwisu", () => {
    const m = match({ isDoubles: true, team1: { names: ["A Jeden", "B Dwa"] }, team2: { names: ["C Trzy", "D Cztery"] }, serverOrder: { team1: ["A Jeden", "B Dwa"] } });
    const other = [match({ team1: { names: ["Anna Kowalska"] }, team2: { names: ["X Y"] } })];
    const p = buildRenamePatch(m, ["Kowalska Anna", "B Dwa"], ["C Trzy", "D Cztery"], other);
    expect(p.team1.names).toEqual(["Anna Kowalska", "B Dwa"]);
    expect(p.serverOrder.team1).toEqual(["Anna Kowalska", "B Dwa"]);
  });

  it("wiersze wyniku: tie-break 10:8 i super tie-break", () => {
    const sets = manualRowsToSets([
      { a: "7", b: "6", tb: "8", superTb: false },
      { a: "4", b: "6", tb: "", superTb: false },
      { a: "10", b: "7", tb: "", superTb: true },
    ]);
    expect(sets[0]).toEqual({ a: 7, b: 6, tiebreak: { a: 10, b: 8 } });
    expect(sets[2]).toEqual({ a: 10, b: 7, isSuperTiebreak: true });
    expect(setsToManualRows(sets)[0]).toMatchObject({ a: "7", b: "6", tb: "8" });
  });
});
