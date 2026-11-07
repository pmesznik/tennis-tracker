import { describe, it, expect } from "vitest";
import { computeScore, PRESETS } from "../src/matchtracker/scoringEngine.js";
import { gamesLog, setSpec } from "./helpers.js";

const pts = (w, n) => Array.from({ length: n }, () => ({ winner: w }));
const tb = PRESETS.best_of_3_tb;

describe("scenariusze meczu", () => {
  it("set 7:5 i 7:6 z tie-breakiem", () => {
    const s75 = computeScore(tb, gamesLog(setSpec("team1", "team2", 7, 5)));
    expect(s75.sets[0]).toMatchObject({ a: 7, b: 5 });
    const seq = setSpec("team1", "team2", 6, 6).slice(0, 12);
    const log = [...gamesLog(seq), ...pts("team1", 7)];
    const s = computeScore(tb, log);
    expect(s.sets[0]).toMatchObject({ a: 7, b: 6, tiebreak: { a: 7, b: 0 } });
  });

  it("tie-break wygrany 10:8 (po minimalnej różnicy 2)", () => {
    const seq = [];
    for (let i = 0; i < 6; i++) { seq.push("team1", "team2"); }
    const tbPts = [];
    for (let i = 0; i < 8; i++) tbPts.push({ winner: "team1" }, { winner: "team2" });
    tbPts.push({ winner: "team1" }, { winner: "team1" });
    const s = computeScore(tb, [...gamesLog(seq), ...tbPts]);
    expect(s.sets[0].tiebreak).toEqual({ a: 10, b: 8 });
  });

  it("serwis w tie-breaku: 1-2-2-2 oraz pointServer", () => {
    const seq = [];
    for (let i = 0; i < 6; i++) seq.push("team1", "team2");
    const base = gamesLog(seq);
    const servers = [];
    let log = [...base];
    for (let i = 0; i < 6; i++) {
      servers.push(computeScore(tb, log).pointServer);
      log = [...log, { winner: i % 2 ? "team1" : "team2" }];
    }
    // po 12 gemach serwuje znów team1; tie-break: A, B, B, A, A, B
    expect(servers).toEqual(["team1", "team2", "team2", "team1", "team1", "team2"]);
  });

  it("super tie-break: do 10 z różnicą 2, serwis 1-2-2", () => {
    const rules = PRESETS.best_of_3_super_tb;
    const sets = [...gamesLog(setSpec("team1", "team2", 6, 0)), ...gamesLog(setSpec("team2", "team1", 6, 0))];
    const start = computeScore(rules, sets);
    expect(start.game.isSuperTiebreak).toBe(true);
    const first = start.pointServer;
    const after1 = computeScore(rules, [...sets, { winner: "team1" }]).pointServer;
    const after2 = computeScore(rules, [...sets, { winner: "team1" }, { winner: "team1" }]).pointServer;
    expect(after1).not.toBe(first);
    expect(after2).toBe(after1);
    // 10:9 jeszcze nie kończy, 11:9 kończy
    const l = [...sets];
    for (let i = 0; i < 9; i++) l.push({ winner: "team1" }, { winner: "team2" });
    l.push({ winner: "team1" });
    expect(computeScore(rules, l).matchWinner).toBe(null);
    l.push({ winner: "team1" });
    const done = computeScore(rules, l);
    expect(done.matchWinner).toBe("team1");
    expect(done.sets[2]).toMatchObject({ a: 11, b: 9, isSuperTiebreak: true });
  });

  it("no-ad: 40:40 rozstrzyga jeden punkt", () => {
    const r = PRESETS.best_of_3_no_ad;
    const log = [...pts("team1", 3), ...pts("team2", 3), ...pts("team2", 1)];
    const s = computeScore(r, log);
    expect(s.curSetGamesB).toBe(1);
  });

  it("pro set do 8 z tie-breakiem przy 8:8", () => {
    const r = PRESETS.pro_set_8;
    const seq = [];
    for (let i = 0; i < 8; i++) seq.push("team1", "team2");
    const s = computeScore(r, [...gamesLog(seq), ...pts("team2", 7)]);
    expect(s.matchWinner).toBe("team2");
    expect(s.sets[0]).toMatchObject({ a: 8, b: 9 });
  });

  it("punkty po zakończeniu meczu są ignorowane", () => {
    const win = [...gamesLog(setSpec("team1", "team2", 6, 0)), ...gamesLog(setSpec("team1", "team2", 6, 0))];
    const s = computeScore(tb, [...win, ...pts("team2", 20)]);
    expect(s.matchWinner).toBe("team1");
    expect(s.sets.length).toBe(2);
  });
});

describe("dodatkowe formaty", () => {
  it("krótkie sety do 4: 4:2 kończy seta, 3:3 daje tie-break do 7 (4:3)", () => {
    const r = PRESETS.short_sets_4;
    const s42 = computeScore(r, gamesLog(setSpec("team1", "team2", 4, 2)));
    expect(s42.sets[0]).toMatchObject({ a: 4, b: 2 });
    const seq = ["team1", "team2", "team1", "team2", "team1", "team2"];
    const s = computeScore(r, [...gamesLog(seq), ...pts("team1", 7)]);
    expect(s.sets[0]).toMatchObject({ a: 4, b: 3, tiebreak: { a: 7, b: 0 } });
  });

  it("3. set z tie-breakiem do 10 przy 6:6", () => {
    const r = PRESETS.best_of_3_tb10;
    const first = gamesLog(setSpec("team1", "team2", 6, 0));
    const second = gamesLog(setSpec("team2", "team1", 6, 0));
    const seq = [];
    for (let i = 0; i < 6; i++) seq.push("team1", "team2");
    const base = [...first, ...second, ...gamesLog(seq)];
    const at7 = computeScore(r, [...base, ...pts("team1", 7)]);
    expect(at7.matchWinner).toBe(null); // do 7 jeszcze za mało
    const at10 = computeScore(r, [...base, ...pts("team1", 10)]);
    expect(at10.matchWinner).toBe("team1");
    expect(at10.sets[2].tiebreak).toEqual({ a: 10, b: 0 });
    // w 1. secie nadal do 7
    const s1 = [...gamesLog(seq), ...pts("team1", 7)];
    expect(computeScore(r, s1).sets[0].tiebreak).toEqual({ a: 7, b: 0 });
  });
});
