import { describe, it, expect } from "vitest";
import { earlyResult, earlySetsRow } from "../src/matchtracker/earlyEnd.js";
import { manualRowsToSets, validateManualRows, setsToManualRows } from "../src/matchtracker/matchEdit.js";
import { deriveWinner } from "../src/matchtracker/shareLink.js";
import { computeH2H } from "../src/matchtracker/h2h.js";

const base = { status: "completed", rules: null, pointLog: [], team1: { names: ["Ala"] }, team2: { names: ["Ola"] }, surface: "Twarda" };

describe("ręczny krecz i walkower", () => {
  it("niedokończony set przechodzi przez wiersze i dopuszcza remis gemów", () => {
    const rows = [{ a: "6", b: "4", tbA: "", tbB: "", superTb: false }, { a: "3", b: "3", tbA: "", tbB: "", superTb: false, partial: true }];
    expect(validateManualRows(rows)).toBe(null);
    const sets = manualRowsToSets(rows);
    expect(sets).toEqual([{ a: 6, b: 4 }, { a: 3, b: 3, partial: true }]);
    expect(setsToManualRows(sets)[1].partial).toBe(true);
  });

  it("remis w pełnym secie nadal jest błędem", () => {
    expect(validateManualRows([{ a: "3", b: "3" }])).toBe("setup.errDraw");
  });

  it("krecz: sety z wyniku, zwycięzca = rywal, napis krecz", () => {
    const m = { ...base, endReason: "retired", resultWinner: "team1", finalSetsOverride: [{ a: 6, b: 4 }, { a: 2, b: 3, partial: true }] };
    expect(earlyResult(m).sets).toHaveLength(2);
    expect(earlyResult(m).winner).toBe("team1");
    expect(earlySetsRow(m)).toEqual(["6-4", "2-3", "krecz"]);
    expect(deriveWinner(m)).toBe("team1");
  });

  it("walkower: bez setów, tylko w/o", () => {
    const m = { ...base, endReason: "walkover", resultWinner: "team2", finalSetsOverride: [] };
    expect(earlyResult(m).sets).toEqual([]);
    expect(earlySetsRow(m)).toEqual(["walkower"]);
    expect(deriveWinner(m)).toBe("team2");
  });

  it("statystyki H2H: niedokończony set nie liczy się jako wygrany, walkower daje mecz", () => {
    const m1 = { ...base, id: "1", endReason: "retired", resultWinner: "team1", finalSetsOverride: [{ a: 6, b: 4 }, { a: 2, b: 3, partial: true }] };
    const m2 = { ...base, id: "2", endReason: "walkover", resultWinner: "team1", finalSetsOverride: [] };
    const r = computeH2H([m1, m2], "Ala", "Ola");
    expect(r.a.matchesWon).toBe(2);
    expect(r.a.setsWon).toBe(1);
    expect(r.b.setsWon).toBe(0);
    expect(r.a.gamesWon).toBe(8);
  });
});
