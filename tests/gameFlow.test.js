import { describe, it, expect } from "vitest";
import { pointLabel, buildGames } from "../src/matchtracker/gameFlow.js";

describe("gameFlow", () => {
  it("podpisy wyniku zwycięzcy punktu", () => {
    expect(pointLabel(1, 0, false, false)).toBe("15");
    expect(pointLabel(2, 1, false, false)).toBe("30");
    expect(pointLabel(3, 1, false, false)).toBe("40");
    expect(pointLabel(3, 3, false, false)).toBe("40");
    expect(pointLabel(4, 3, false, false)).toBe("AD");
    expect(pointLabel(5, 4, true, false)).toBe("5");
    expect(pointLabel(4, 0, false, true)).toBe("gem");
  });
  it("dzieli zapis punktów na gemy", () => {
    const log = ["team1", "team1", "team1", "team1", "team2", "team2", "team2", "team2"].map((winner) => ({ winner }));
    const tl = { gameEnds: [{ end: 4, set: 1, winner: "team1", tb: false }, { end: 8, set: 1, winner: "team2", tb: false }] };
    const g = buildGames({ pointLog: log }, tl);
    expect(g).toHaveLength(2);
    expect(g[0].points.map((p) => p.label)).toEqual(["15", "30", "40", "gem"]);
    expect(g[1]).toMatchObject({ set: 1, game: 2, winner: "team2" });
    expect(g[1].points[0].a).toBe(false);
  });
});
