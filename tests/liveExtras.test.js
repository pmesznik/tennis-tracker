import { describe, it, expect } from "vitest";
import { buildLiveExtras } from "../src/matchtracker/liveExtras.js";
import { computeScore } from "../src/matchtracker/scoringEngine.js";

const rules = { key: "best_of_3_tb", sets: 3, gamesPerSet: 6, noAd: false, tiebreakAt: 6, tiebreakTo: 7, finalSetSuperTiebreak: false, finalSetSuperTiebreakTo: 10 };
const mk = (winners, extra = {}) => ({
  rules, trackingDepth: "basic", initialServer: "team1", startedAt: 1000,
  pointLog: winners.map((w, i) => ({ winner: w, server: "team1", t: 2000 + i * 1000 })), ...extra,
});

describe("buildLiveExtras", () => {
  it("zegary, punkty i bieżący gem", () => {
    const m = mk(["team1", "team1", "team1", "team1", "team2", "team1"]);
    const sc = computeScore(rules, m.pointLog, "team1", m.startedAt);
    const e = buildLiveExtras(m, sc, 10000);
    expect(e.v).toBe(2);
    expect(e.ms).toBe(9000);
    expect(e.ps).toBe(10000 - 7000);
    expect(e.pts).toEqual([5, 1]);
    expect(e.gp).toBe("ba");
    expect(e.st1).toBeUndefined();
  });
  it("pauza zatrzymuje zegary", () => {
    const m = mk(["team1"], { pausedAt: 5000, pausedMs: 1000 });
    const sc = computeScore(rules, m.pointLog, "team1", m.startedAt);
    const e = buildLiveExtras(m, sc, 99999);
    expect(e.ms).toBe(5000 - 1000 - 1000);
  });
});
