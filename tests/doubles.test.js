import { describe, it, expect } from "vitest";
import { computeH2H, computePlayerStats, listH2HPlayers, listH2HTeams, listH2HTeamOpponents } from "../src/matchtracker/h2h.js";
import { match } from "./helpers.js";

const dbl = (t1, t2, sets, over = {}) =>
  match({ isDoubles: true, team1: { names: t1 }, team2: { names: t2 }, finalSetsOverride: sets.map(([a, b]) => ({ a, b })), ...over });

describe("statystyki deblowe", () => {
  const ms = [
    dbl(["Ala", "Ewa"], ["Ola", "Iga"], [[6, 4], [6, 3]]),
    dbl(["Iga", "Ola"], ["Ewa", "Ala"], [[6, 2], [6, 2]]),
    dbl(["Ala", "Kasia"], ["Ola", "Iga"], [[6, 0], [6, 0]]),
    match({ team1: { names: ["Ala"] }, team2: { names: ["Ola"] }, finalSetsOverride: [{ a: 6, b: 0 }] }),
  ];
  it("para kontra para ignoruje kolejność zawodników i single", () => {
    const h = computeH2H(ms, "Ala / Ewa", "Ola / Iga", "doubles");
    expect(h.total).toBe(2);
    expect(h.a.matchesWon).toBe(1);
    expect(h.b.matchesWon).toBe(1);
    expect(h.a.gamesWon).toBe(6 + 6 + 2 + 2);
    expect(h.b.gamesWon).toBe(4 + 3 + 6 + 6);
  });
  it("zawodnik w deblu liczy mecze z każdym partnerem", () => {
    const p = computePlayerStats(ms, "ala", "doubles");
    expect(p.total).toBe(3);
    expect(p.a.matchesWon).toBe(2);
    expect(p.opponents.map((o) => [o.name, o.won, o.lost])).toEqual([["Ola / Iga", 2, 1]].map((x) => x));
  });
  it("listy zawodników i par deblowych", () => {
    expect(listH2HPlayers(ms, "doubles").map((x) => x.name)).toContain("Kasia");
    expect(listH2HPlayers(ms, "singles").length).toBe(2);
    expect(listH2HTeams(ms)[0].count).toBe(3);
    expect(listH2HTeamOpponents(ms, "Ala / Ewa").map((x) => x.name)).toEqual(["Ola / Iga"]);
  });
});
