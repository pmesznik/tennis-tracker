import { describe, it, expect } from "vitest";
import { computeScore, PRESETS } from "../src/matchtracker/scoringEngine.js";
import { gamesLog, setSpec } from "./helpers.js";

const R = PRESETS.best_of_3_tb;

describe("scoringEngine", () => {
  it("zlicza gem do zera i naprzemienny serwis", () => {
    const sc = computeScore(R, gamesLog(["team1"]), "team1");
    expect(sc.curSetGamesA).toBe(1);
    expect(sc.server).toBe("team2");
  });
  it("set 6:4 i mecz 2:0", () => {
    const spec = [...setSpec("team1", "team2", 6, 4), ...setSpec("team1", "team2", 6, 2)];
    const sc = computeScore(R, gamesLog(spec), "team1");
    expect(sc.sets.map((s) => `${s.a}-${s.b}`)).toEqual(["6-4", "6-2"]);
    expect(sc.matchWinner).toBe("team1");
  });
  it("tie-break przy 6:6 daje set 7:6", () => {
    const spec = [];
    for (let i = 0; i < 6; i++) spec.push("team1", "team2");
    const log = gamesLog(spec);
    for (let i = 0; i < 7; i++) log.push({ winner: "team1", server: "team1", t: 9000 + i });
    const sc = computeScore(R, log, "team1");
    expect(sc.sets[0]).toMatchObject({ a: 7, b: 6, tiebreak: { a: 7, b: 0 } });
  });
  it("deuce wymaga przewagi dwóch punktów, no-ad kończy gem przy 40:40", () => {
    const deuce = [];
    for (let i = 0; i < 3; i++) deuce.push({ winner: "team1" }, { winner: "team2" });
    expect(computeScore(R, deuce, "team1").game.deuce).toBe(true);
    const noad = computeScore(PRESETS.best_of_3_no_ad, [...deuce, { winner: "team1" }], "team1");
    expect(noad.curSetGamesA).toBe(1);
  });
  it("super tie-break w trzecim secie do 10", () => {
    const rules = PRESETS.best_of_3_super_tb;
    const spec = [...setSpec("team1", "team2", 6, 0), ...setSpec("team2", "team1", 6, 0)];
    const log = gamesLog(spec);
    for (let i = 0; i < 10; i++) log.push({ winner: "team2", server: "team1" });
    const sc = computeScore(rules, log, "team1");
    expect(sc.sets[2]).toMatchObject({ a: 0, b: 10, isSuperTiebreak: true });
    expect(sc.matchWinner).toBe("team2");
  });
});
