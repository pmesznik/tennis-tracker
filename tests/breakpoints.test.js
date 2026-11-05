import { describe, it, expect } from "vitest";
import { PRESETS } from "../src/matchtracker/scoringEngine.js";
import { computeBreakPoints } from "../src/matchtracker/stats.js";
import { computePlayerStats } from "../src/matchtracker/h2h.js";
import { gamesLog, setSpec, match } from "./helpers.js";

const pts = (...w) => w.map((x) => ({ winner: x === 1 ? "team1" : "team2" }));

describe("break pointy", () => {
  it("liczy szanse przy 0:40, 15:40, 30:40, Ad i konwersję", () => {
    const log = pts(2, 2, 2, 1, 1, 1, 2, 1, 2, 2);
    const bp = computeBreakPoints(PRESETS.best_of_3_tb, log, "team1");
    expect(bp.team2).toEqual({ opp: 5, conv: 1 });
    expect(bp.team1).toEqual({ opp: 0, conv: 0 });
  });
  it("w grze bez przewag decydujący punkt przy 40:40 jest break pointem", () => {
    const log = pts(1, 2, 1, 2, 1, 2, 2);
    const bp = computeBreakPoints(PRESETS.best_of_3_no_ad, log, "team1");
    expect(bp.team2).toEqual({ opp: 1, conv: 1 });
  });
  it("tie-break nie ma break pointów", () => {
    const spec = [];
    for (let i = 0; i < 6; i++) spec.push("team1", "team2");
    const log = [...gamesLog(spec), ...pts(2, 2, 2, 2, 2, 2, 2)];
    const before = computeBreakPoints(PRESETS.best_of_3_tb, gamesLog(spec), "team1");
    const after = computeBreakPoints(PRESETS.best_of_3_tb, log, "team1");
    expect(after).toEqual(before);
  });
  it("brak punktów lub zasad nie wywala", () => {
    expect(computeBreakPoints(null, [], "team1").team1.opp).toBe(0);
  });
});

describe("statystyki zawodnika", () => {
  it("sumuje mecze ze wszystkimi rywalami i zwraca bilans z każdym", () => {
    const m = (a, b, sets, over = {}) => match({ team1: { names: [a] }, team2: { names: [b] }, finalSetsOverride: sets.map(([x, y]) => ({ a: x, b: y })), ...over });
    const ms = [
      m("Ala", "Ola", [[6, 0], [6, 0]]),
      m("Ewa", "ala", [[6, 1], [6, 1]]),
      m("Ala", "Ewa", [[6, 2], [6, 2]]),
      m("Ola", "Ewa", [[6, 2], [6, 2]]),
    ];
    const p = computePlayerStats(ms, "Ala");
    expect(p.total).toBe(3);
    expect(p.a.matchesWon).toBe(2);
    expect(p.b.matchesWon).toBe(1);
    expect(p.opponents.map((o) => [o.name, o.won, o.lost])).toEqual([["Ewa", 1, 1], ["Ola", 1, 0]]);
  });
  it("break pointy trafiają do statystyk meczu", () => {
    const log = pts(2, 2, 2, 2);
    const m = match({ team1: { names: ["Ala"] }, team2: { names: ["Ola"] }, pointLog: log });
    const p = computePlayerStats([m], "Ola");
    expect(p.a.bpOpp).toBe(1);
    expect(p.a.bpConv).toBe(1);
    expect(p.b.bpOpp).toBe(0);
  });
});
