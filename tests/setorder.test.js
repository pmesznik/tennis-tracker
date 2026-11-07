import { describe, it, expect } from "vitest";
import { computeScore, currentServerPlayerName } from "../src/matchtracker/scoringEngine.js";
import { gamesLog, setSpec, rulesTb } from "./helpers.js";

const base = {
  isDoubles: true, initialServer: "team1", rules: rulesTb,
  team1: { names: ["A1", "A2"] }, team2: { names: ["B1", "B2"] },
  serverOrder: { team1: ["A1", "A2"], team2: ["B1", "B2"] },
};

describe("debel: kolejność serwisu w kolejnych setach", () => {
  it("w pierwszym secie rotacja według kolejności z początku meczu", () => {
    const log = gamesLog(["team1", "team2", "team1"]);
    const m = { ...base, pointLog: log };
    const sc = computeScore(rulesTb, log, "team1");
    // 4. gem: serwuje team2, jego 2. gem serwisowy -> B2
    expect(sc.server).toBe("team2");
    expect(currentServerPlayerName(m, sc)).toBe("B2");
  });

  it("w nowym secie obowiązuje wskazana kolejność liczona od początku seta", () => {
    // set 1: 6:0 dla team1 (6 gemów); set 2 zaczyna się gemem 7: serwuje team1
    const log = gamesLog(setSpec("team1", "team2", 6, 0));
    const sc = computeScore(rulesTb, log, "team1");
    expect(sc.sets.length).toBe(1);
    expect(sc.server).toBe("team1");
    // bez wskazania: stara rotacja (4. gem serwisowy team1 -> A2)
    expect(currentServerPlayerName({ ...base, pointLog: log }, sc)).toBe("A2");
    // para zmienia kolejność: w secie 2 zaczyna A2
    const m2 = { ...base, pointLog: log, serverOrderBySet: { 1: { team1: ["A2", "A1"] } } };
    expect(currentServerPlayerName(m2, sc)).toBe("A2");
    // po jednym gemie w secie 2 serwuje team2 według jego kolejności z meczu/seta
    const log2 = [...log, ...gamesLog(["team1"], "team2")];
    const sc2 = computeScore(rulesTb, log2, "team1");
    expect(sc2.server).toBe("team2");
    const m3 = { ...m2, pointLog: log2, serverOrderBySet: { 1: { team1: ["A2", "A1"], team2: ["B2", "B1"] } } };
    expect(currentServerPlayerName(m3, sc2)).toBe("B2");
    // i znów team1: 2. gem serwisowy w secie -> A1
    const log3 = [...log2, ...gamesLog(["team2"], "team1")];
    const sc3 = computeScore(rulesTb, log3, "team1");
    expect(sc3.server).toBe("team1");
    expect(currentServerPlayerName({ ...m3, pointLog: log3 }, sc3)).toBe("A1");
  });
});
