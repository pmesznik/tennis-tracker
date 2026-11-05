import { describe, it, expect } from "vitest";
import { computeH2H, listH2HOpponents, listH2HPlayers, normName } from "../src/matchtracker/h2h.js";
import { gamesLog, setSpec, match } from "./helpers.js";

const manual = (n1, n2, sets, over = {}) =>
  match({ team1: { names: [n1] }, team2: { names: [n2] }, finalSetsOverride: sets.map(([a, b]) => ({ a, b })), ...over });

describe("h2h", () => {
  it("normalizuje nazwy (wielkość liter, spacje, polskie znaki)", () => {
    expect(normName("  Łukasz  Żak ")).toBe(normName("lukasz zak"));
  });

  it("liczy bilans niezależnie od tego, kto był team1", () => {
    const ms = [
      manual("Ala", "Ola", [[6, 4], [6, 3]]),
      manual("ola", "ALA", [[6, 2], [6, 1]]),
      manual("Ala", "Ola", [[4, 6], [6, 3], [7, 5]]),
    ];
    const h = computeH2H(ms, "Ala", "Ola");
    expect(h.total).toBe(3);
    expect(h.a.matchesWon).toBe(2);
    expect(h.b.matchesWon).toBe(1);
    expect(h.a.setsWon).toBe(2 + 0 + 2);
    expect(h.b.setsWon).toBe(0 + 2 + 1);
    expect(h.a.gamesWon).toBe(6 + 6 + 2 + 1 + 4 + 6 + 7);
    expect(h.b.gamesWon).toBe(4 + 3 + 6 + 6 + 6 + 3 + 5);
    expect(h.detailedMatches).toBe(0);
  });

  it("pomija deble, mecze w trakcie i innych rywali", () => {
    const ms = [
      manual("Ala", "Ola", [[6, 0], [6, 0]]),
      manual("Ala", "Ola", [[6, 0], [6, 0]], { isDoubles: true, team1: { names: ["Ala", "X"] }, team2: { names: ["Ola", "Y"] } }),
      manual("Ala", "Ola", [[6, 0], [6, 0]], { status: "in_progress" }),
      manual("Ala", "Ewa", [[6, 0], [6, 0]]),
    ];
    expect(computeH2H(ms, "Ala", "Ola").total).toBe(1);
  });

  it("super tie-break liczy set, ale nie gemy", () => {
    const m = manual("Ala", "Ola", [[6, 4], [3, 6]]);
    m.finalSetsOverride.push({ a: 10, b: 7, isSuperTiebreak: true });
    const h = computeH2H([m], "Ala", "Ola");
    expect(h.a.setsWon).toBe(2);
    expect(h.a.gamesWon).toBe(9);
    expect(h.list[0].sets[2]).toBe("[10-7]");
  });

  it("punkty i serwis z pointLog, w orientacji A/B", () => {
    const spec = [...setSpec("team1", "team2", 6, 0), ...setSpec("team1", "team2", 6, 0)];
    const log = gamesLog(spec);
    log[0] = { ...log[0], endType: "ace" };
    const m = match({ team1: { names: ["Ola"] }, team2: { names: ["Ala"] }, pointLog: log, trackingDepth: "medium" });
    const h = computeH2H([m], "Ala", "Ola");
    expect(h.detailedMatches).toBe(1);
    expect(h.b.matchesWon).toBe(1);
    expect(h.b.pointsWon).toBe(log.length);
    expect(h.a.pointsWon).toBe(0);
    expect(h.b.aces).toBe(1);
    expect(h.b.servePointsTotal + h.a.servePointsTotal).toBe(log.length);
    expect(h.a.returnPointsTotal).toBe(h.b.servePointsTotal);
  });

  it("seria i nawierzchnie", () => {
    const ms = [
      manual("Ala", "Ola", [[6, 0], [6, 0]], { date: "2026-01-01", surface: "Ziemna" }),
      manual("Ola", "Ala", [[6, 0], [6, 0]], { date: "2026-02-01" }),
      manual("Ala", "Ola", [[0, 6], [0, 6]], { date: "2026-03-01" }),
    ];
    const h = computeH2H(ms, "Ala", "Ola");
    expect(h.streak).toEqual({ who: "b", count: 2 });
    expect(h.bySurface.Ziemna).toEqual({ a: 1, b: 0 });
    expect(h.list.map((x) => x.date)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
  });

  it("listy zawodników i rywali", () => {
    const ms = [manual("Ala", "Ola", [[6, 0]]), manual("Ala", "Ewa", [[6, 0]]), manual("ala", "Ola", [[6, 0]])];
    expect(listH2HPlayers(ms)[0].name).toBe("Ala");
    expect(listH2HOpponents(ms, "ALA").map((o) => [o.name, o.count])).toEqual([["Ola", 2], ["Ewa", 1]]);
  });

  it("brak spotkań to zera, bez wyjątku", () => {
    const h = computeH2H([], "A", "B");
    expect(h.total).toBe(0);
    expect(h.streak.who).toBeNull();
  });
});
