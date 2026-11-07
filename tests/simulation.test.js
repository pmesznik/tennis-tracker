import { describe, it, expect } from "vitest";
import { computeScore, PRESETS } from "../src/matchtracker/scoringEngine.js";
import { computeBreakPoints } from "../src/matchtracker/stats.js";

// Mały generator liczb losowych (powtarzalny), żeby testy były deterministyczne.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Gra losowy mecz do końca; p = szansa punktu dla team1. Zwraca pointLog.
function playMatch(rules, seed, p = 0.5, initialServer = "team1") {
  const r = rng(seed);
  const log = [];
  let sc = computeScore(rules, log, initialServer);
  let guard = 0;
  while (!sc.matchWinner && guard++ < 6000) {
    const winner = r() < p ? "team1" : "team2";
    log.push({ winner, server: sc.pointServer, t: 1000 + log.length });
    sc = computeScore(rules, log, initialServer);
  }
  return { log, sc };
}

function checkSet(rules, s, isFinalSuper) {
  if (s.isSuperTiebreak) {
    expect(isFinalSuper).toBe(true);
    const w = Math.max(s.a, s.b), l = Math.min(s.a, s.b);
    expect(w).toBeGreaterThanOrEqual(rules.finalSetSuperTiebreakTo);
    expect(w - l).toBeGreaterThanOrEqual(2);
    if (w > rules.finalSetSuperTiebreakTo) expect(w - l).toBe(2);
    return;
  }
  const w = Math.max(s.a, s.b), l = Math.min(s.a, s.b);
  if (s.tiebreak) {
    expect(w).toBe(rules.tiebreakAt + 1);
    expect(l).toBe(rules.tiebreakAt);
    const tw = Math.max(s.tiebreak.a, s.tiebreak.b), tl = Math.min(s.tiebreak.a, s.tiebreak.b);
    const target = s.finalTbTarget || rules.tiebreakTo;
    expect(tw).toBeGreaterThanOrEqual(target);
    expect(tw - tl).toBeGreaterThanOrEqual(2);
    if (tw > target) expect(tw - tl).toBe(2);
    // wygrywający tie-break wygrywa seta
    expect(s.tiebreak.a > s.tiebreak.b).toBe(s.a > s.b);
  } else {
    // 6-0..6-4 albo 7-5 (przy tiebreakAt === gamesPerSet); krótkie sety: 4-0..4-2
    const ok = (w === rules.gamesPerSet && w - l >= 2) || (w === rules.gamesPerSet + 1 && l === rules.gamesPerSet - 1 && rules.tiebreakAt === rules.gamesPerSet);
    expect(ok, `zły wynik seta ${s.a}-${s.b}`).toBe(true);
  }
}

const variants = [];
for (const key of Object.keys(PRESETS)) {
  variants.push([key, PRESETS[key]]);
  variants.push([key + " start 2:2", { ...PRESETS[key], setStartGames: 2 }]);
}
// Dodatkowo bo3 bez super tie-breaka (pełny 3. set) i z nim.
variants.push(["bo3 pełny 3. set start 2:2", { ...PRESETS.best_of_3_super_tb, finalSetSuperTiebreak: false, setStartGames: 2 }]);

describe("symulacja losowych meczów (wszystkie formaty)", () => {
  for (const [name, rules] of variants) {
    it(`${name}: każdy mecz kończy się poprawnie`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const p = [0.5, 0.58, 0.7, 0.45][seed % 4];
        const server = seed % 2 ? "team1" : "team2";
        const { log, sc } = playMatch(rules, seed * 7919, p, server);
        expect(sc.matchWinner, `${name} seed ${seed} nie skończył się`).not.toBe(null);
        const need = Math.ceil(rules.sets / 2);
        expect(Math.max(sc.setsWonA, sc.setsWonB)).toBe(need);
        expect(sc.setsWonA === need ? "team1" : "team2").toBe(sc.matchWinner);
        // liczba setów mieści się w limicie
        expect(sc.sets.length).toBeLessThanOrEqual(rules.sets);
        sc.sets.forEach((s, i) => {
          const isFinal = i === rules.sets - 1 && sc.sets.length === rules.sets;
          const isFinalSuper = rules.finalSetSuperTiebreak && i === rules.sets - 1;
          const fs = isFinal && rules.finalSetTiebreakTo && s.tiebreak ? { ...s, finalTbTarget: rules.finalSetTiebreakTo } : s;
          checkSet(rules, fs, isFinalSuper);
          // set zwycięzcy zgadza się z licznikiem setów
        });
        // serwis w każdym punkcie jest zapisany i ma sens
        expect(log.every((pt) => pt.server === "team1" || pt.server === "team2")).toBe(true);
        // break pointy nie przekraczają liczby punktów
        const bp = computeBreakPoints(rules, log, server);
        expect(bp.team1.conv).toBeLessThanOrEqual(bp.team1.opp);
        expect(bp.team2.conv).toBeLessThanOrEqual(bp.team2.opp);
        // gemy: każdy wygrany set ma co najmniej tyle gemów, ile wymaga format
        if (rules.setStartGames) {
          sc.sets.filter((s) => !s.isSuperTiebreak).forEach((s) => {
            expect(Math.min(s.a, s.b)).toBeGreaterThanOrEqual(rules.setStartGames);
          });
        }
      }
    });
  }

  it("start 2:2: nowy set zaczyna się od 2:2, a super tie-break od 0:0", () => {
    const rules = { ...PRESETS.best_of_3_super_tb, setStartGames: 2 };
    const sc0 = computeScore(rules, []);
    expect([sc0.curSetGamesA, sc0.curSetGamesB]).toEqual([2, 2]);
    // team1 wygrywa 4 gemy (6:2), potem team2 wygrywa 4 gemy (2:6) -> 1:1, super tie-break
    const log = [];
    const g = (w) => { for (let k = 0; k < 4; k++) log.push({ winner: w, server: "team1" }); };
    for (let i = 0; i < 4; i++) g("team1");
    let sc = computeScore(rules, log);
    expect(sc.sets[0]).toMatchObject({ a: 6, b: 2 });
    expect([sc.curSetGamesA, sc.curSetGamesB]).toEqual([2, 2]);
    for (let i = 0; i < 4; i++) g("team2");
    sc = computeScore(rules, log);
    expect(sc.sets[1]).toMatchObject({ a: 2, b: 6 });
    expect(sc.game.isSuperTiebreak).toBe(true);
    expect([sc.curSetGamesA, sc.curSetGamesB]).toEqual([0, 0]);
  });

  it("start 2:2: tie-break nadal przy 6:6", () => {
    const rules = { ...PRESETS.best_of_3_tb, setStartGames: 2 };
    const log = [];
    const g = (w) => { for (let k = 0; k < 4; k++) log.push({ winner: w, server: "team1" }); };
    // z 2:2 do 6:6: po 4 gemy każdy, na zmianę
    for (let i = 0; i < 4; i++) { g("team1"); g("team2"); }
    const sc = computeScore(rules, log);
    expect([sc.curSetGamesA, sc.curSetGamesB]).toEqual([6, 6]);
    expect(sc.game.isTiebreak).toBe(true);
  });
});

import { currentServerPlayerName } from "../src/matchtracker/scoringEngine.js";

describe("debel: serwujący zawsze z właściwej drużyny (także tie-break i start 2:2)", () => {
  for (const [name, rules] of variants) {
    it(name, () => {
      const names = { team1: ["A1", "A2"], team2: ["B1", "B2"] };
      const match = { isDoubles: true, initialServer: "team1", rules, team1: { names: names.team1 }, team2: { names: names.team2 }, serverOrder: { team1: names.team1, team2: names.team2 } };
      const r = rng(42);
      const log = [];
      let sc = computeScore(rules, log, "team1");
      let guard = 0;
      while (!sc.matchWinner && guard++ < 4000) {
        const who = currentServerPlayerName({ ...match, pointLog: log }, sc);
        expect(who, `brak serwującego przy punkcie ${log.length}`).not.toBe(null);
        expect(names[sc.pointServer]).toContain(who);
        log.push({ winner: r() < 0.55 ? "team1" : "team2", server: sc.pointServer });
        sc = computeScore(rules, log, "team1");
      }
      expect(sc.matchWinner).not.toBe(null);
    });
  }
});
