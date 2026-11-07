import { describe, it, expect } from "vitest";
import { computeH2H } from "../src/matchtracker/h2h.js";
import { deriveWinner } from "../src/matchtracker/shareLink.js";
import { earlySetsRow } from "../src/matchtracker/earlyEnd.js";
import { match, gamesLog, setSpec } from "./helpers.js";

// Ala wygrała 1. set 6:2, w 2. secie prowadzi 3:1 i Ola się wycofała (krecz).
const retired = () => {
  const log = [...gamesLog(setSpec("team1", "team2", 6, 2)), ...gamesLog(["team1", "team2", "team1", "team1"])];
  return match({ status: "completed", pointLog: log, endReason: "retired", resultWinner: "team1" });
};

describe("mecz zakończony przed czasem", () => {
  it("krecz: wynik do przerwania, zwycięzca z pola resultWinner", () => {
    const m = retired();
    expect(earlySetsRow(m)).toEqual(["6-2", "3-1", "krecz"]);
    expect(deriveWinner(m)).toBe("team1");
  });

  it("H2H: krecz liczy mecz i gemy, ale niedokończony set nie jest wygranym setem", () => {
    const h = computeH2H([retired()], "Ala", "Ola");
    expect(h.total).toBe(1);
    expect(h.a.matchesWon).toBe(1);
    expect(h.a.setsWon).toBe(1);
    expect(h.a.gamesWon).toBe(9);
    expect(h.b.gamesWon).toBe(3);
  });

  it("walkower: zwycięstwo bez setów, gemów i punktów", () => {
    const m = match({ status: "completed", endReason: "walkover", resultWinner: "team2", pointLog: [] });
    expect(earlySetsRow(m)).toEqual(["w/o"]);
    const h = computeH2H([m], "Ala", "Ola");
    expect(h.b.matchesWon).toBe(1);
    expect(h.a.gamesWon + h.b.gamesWon).toBe(0);
    expect(deriveWinner(m)).toBe("team2");
  });
});
