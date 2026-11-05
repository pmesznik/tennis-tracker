import { describe, it, expect } from "vitest";
import { computeStats } from "../src/matchtracker/stats.js";

describe("stats", () => {
  it("liczy asy, podwójne błędy, winnery i błędy", () => {
    const log = [
      { winner: "team1", server: "team1", endType: "ace" },
      { winner: "team2", server: "team1", endType: "doubleFault" },
      { winner: "team2", server: "team1", endType: "winner", endBy: "team2", rallyLength: 4 },
      { winner: "team1", server: "team1", endType: "unforcedError", endBy: "team2", rallyLength: 6, atNet: true },
    ];
    const { stats, avgRally } = computeStats(log);
    expect(stats.team1.aces).toBe(1);
    expect(stats.team1.doubleFaults).toBe(1);
    expect(stats.team2.winners).toBe(1);
    expect(stats.team2.unforcedErrors).toBe(1);
    expect(stats.team2.netPoints).toBe(1);
    expect(avgRally).toBe("5.0");
  });
  it("pusty log nie wywala", () => {
    expect(computeStats([]).avgRally).toBeNull();
  });
});
