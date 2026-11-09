import { describe, it, expect } from "vitest";
import { computeMomentum } from "../src/matchtracker/momentum.js";
import { seasonSummary, yearsOf, filterByYear } from "../src/matchtracker/seasonStats.js";

describe("computeMomentum", () => {
  it("liczy najdłuższe serie punktów dla obu stron", () => {
    const log = ["team1", "team1", "team1", "team2", "team2", "team1"].map((winner) => ({ winner }));
    const m = computeMomentum({ pointLog: log }, null);
    expect(m.pointStreak).toEqual({ a: 3, b: 2 });
    expect(m.gameStreak).toBeNull();
  });

  it("wybiera najdłuższy gem i pomija tie-break", () => {
    const tl = {
      games: [["team1", "team1", "team2"]],
      gameEnds: [
        { end: 4, set: 1, winner: "team1", tb: false },
        { end: 14, set: 1, winner: "team1", tb: false },
        { end: 30, set: 1, winner: "team2", tb: true },
      ],
    };
    const m = computeMomentum({ pointLog: [] }, tl);
    expect(m.gameStreak).toEqual({ a: 2, b: 1 });
    expect(m.longestGame).toEqual({ points: 10, set: 1, game: 2, winner: "team1" });
  });
});

describe("statystyki sezonu", () => {
  const list = [
    { date: "2026-03-01", winner: "a", surface: "clay", opponent: "Ola" },
    { date: "2026-03-10", winner: "a", surface: "clay", opponent: "Ola" },
    { date: "2026-04-02", winner: "b", surface: "hard", opponent: "Ewa" },
    { date: "2026-04-20", winner: "a", surface: "hard", opponent: "Ola" },
  ];
  it("bilans, seria, miesiące, nawierzchnia, rywal", () => {
    const s = seasonSummary(list);
    expect(s).toMatchObject({ played: 4, won: 3, lost: 1, winPct: 75, bestStreak: 2 });
    expect(s.byMonth).toEqual([{ key: "2026-03", w: 2, l: 0 }, { key: "2026-04", w: 1, l: 1 }]);
    expect(s.bestSurface).toMatchObject({ surface: "clay", w: 2, total: 2 });
    expect(s.topOpponent).toEqual({ name: "Ola", n: 3 });
  });
  it("lata i filtr", () => {
    const ms = [{ status: "completed", date: "2025-05-01" }, { status: "completed", date: "2026-01-02" }, { status: "live", date: "2024-01-01" }];
    expect(yearsOf(ms)).toEqual(["2026", "2025"]);
    expect(filterByYear(ms, "2025")).toHaveLength(1);
    expect(filterByYear(ms, "all")).toHaveLength(3);
  });
});
