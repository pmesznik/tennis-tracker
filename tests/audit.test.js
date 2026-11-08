import { describe, it, expect } from "vitest";
import { computeScore, PRESETS } from "../src/matchtracker/scoringEngine.js";
import { validateManualRows, manualRowsToSets, isTiebreakScore } from "../src/matchtracker/matchEdit.js";
import { isValidMatch } from "../src/matchtracker/backup.js";
import { localDateStr } from "../src/matchtracker/time.js";

const pts = (log, w, n) => { for (let i = 0; i < n; i++) log.push({ winner: w, server: "team1" }); };

describe("piłka meczowa w tie-breaku decydującego seta (tb do 10)", () => {
  it("przy 7:6 w tie-breaku seta rozstrzygającego to jeszcze nie piłka meczowa", () => {
    const rules = PRESETS.best_of_3_tb10;
    const log = [];
    // team1 wygrywa 1. set 6:0, team2 wygrywa 2. set 6:0
    for (let i = 0; i < 6; i++) pts(log, "team1", 4);
    for (let i = 0; i < 6; i++) pts(log, "team2", 4);
    // 3. set do 6:6 (gemy na zmianę), potem tie-break do 6:6 w punktach i 7:6
    for (let k = 0; k < 6; k++) { pts(log, "team1", 4); pts(log, "team2", 4); }
    for (let k = 0; k < 6; k++) { pts(log, "team1", 1); pts(log, "team2", 1); }
    pts(log, "team1", 1);
    const sc = computeScore(rules, log, "team1");
    expect(sc.game.isTiebreak).toBe(true);
    expect(sc.isMatchPoint).toBe(false); // tie-break do 10: do wygranej brakuje jeszcze 3 pkt
    pts(log, "team1", 2); // 9:6 -> piłka meczowa
    expect(computeScore(rules, log, "team1").isMatchPoint).toBe(true);
  });
});

describe("ręczny wynik: walidacja i tie-break", () => {
  it("niepełny wiersz i remis w secie", () => {
    expect(validateManualRows([{ a: "6", b: "" }])).toBe("setup.errIncomplete");
    expect(validateManualRows([{ a: "5", b: "5" }])).toBe("setup.errDraw");
    expect(validateManualRows([{ a: "", b: "" }])).toBe("setup.alertNeedOneSet");
    expect(validateManualRows([{ a: "6", b: "4" }, { a: "7", b: "6" }])).toBe(null);
  });
  it("pola TB tylko dla 4:3, 7:6, 9:8", () => {
    expect(isTiebreakScore(7, 6)).toBe(true);
    expect(isTiebreakScore(4, 3)).toBe(true);
    expect(isTiebreakScore(6, 5)).toBe(false);
    expect(isTiebreakScore(5, 4)).toBe(false);
  });
  it("jedna liczba: pole przegranego = punkty przegranego, pole zwycięzcy > 7 = o 2 mniej", () => {
    expect(manualRowsToSets([{ a: "7", b: "6", tbB: "5" }])[0].tiebreak).toEqual({ a: 7, b: 5 });
    expect(manualRowsToSets([{ a: "7", b: "6", tbA: "10" }])[0].tiebreak).toEqual({ a: 10, b: 8 });
    expect(manualRowsToSets([{ a: "7", b: "6", tbA: "7" }])[0].tiebreak).toBeUndefined();
  });
});

describe("import kopii: walidacja rekordów", () => {
  it("odrzuca uszkodzone rekordy", () => {
    const ok = { id: "a", team1: { names: ["A"] }, team2: { names: ["B"] }, pointLog: [], rules: { sets: 3 } };
    expect(isValidMatch(ok)).toBe(true);
    expect(isValidMatch({ ...ok, team1: {} })).toBe(false);
    expect(isValidMatch({ ...ok, pointLog: null })).toBe(false);
    expect(isValidMatch({ ...ok, rules: null })).toBe(false);
    expect(isValidMatch({ ...ok, rules: null, finalSetsOverride: [{ a: 6, b: 4 }] })).toBe(true);
    expect(isValidMatch(null)).toBe(false);
  });
});

describe("data lokalna", () => {
  it("format YYYY-MM-DD z lokalnych składników", () => {
    expect(localDateStr(new Date(2026, 0, 5, 0, 30))).toBe("2026-01-05");
  });
});

import { isBackupDue, dataSignature } from "../src/cloudBackup.js";

describe("kopia w chmurze: kiedy robić automatycznie", () => {
  const DAY = 24 * 3600 * 1000;
  const base = { uri: "content://x", freq: "daily", lastAt: 1000, lastSig: "1:a" };
  it("bez folderu albo ręcznie: nigdy", () => {
    expect(isBackupDue({ ...base, uri: "" }, 1e12, "2:b")).toBe(false);
    expect(isBackupDue({ ...base, freq: "manual" }, 1e12, "2:b")).toBe(false);
  });
  it("brak zmian w danych: nie nadpisuj (poprzednia nie może stać się kopią najnowszej)", () => {
    expect(isBackupDue(base, 1000 + 5 * DAY, "1:a")).toBe(false);
    expect(isBackupDue({ ...base, freq: "match" }, 1000 + 5 * DAY, "1:a")).toBe(false);
  });
  it("po meczu: od razu gdy są zmiany", () => {
    expect(isBackupDue({ ...base, freq: "match" }, 1001, "2:b")).toBe(true);
  });
  it("codziennie i co tydzień: dopiero po upływie okresu", () => {
    expect(isBackupDue(base, 1000 + DAY - 1, "2:b")).toBe(false);
    expect(isBackupDue(base, 1000 + DAY, "2:b")).toBe(true);
    expect(isBackupDue({ ...base, freq: "weekly" }, 1000 + 6 * DAY, "2:b")).toBe(false);
    expect(isBackupDue({ ...base, freq: "weekly" }, 1000 + 7 * DAY, "2:b")).toBe(true);
  });
  it("podpis danych zmienia się po dodaniu meczu", () => {
    expect(dataSignature([{ updatedAt: "2026-01-01" }])).not.toBe(dataSignature([{ updatedAt: "2026-01-01" }, { updatedAt: "2026-01-01" }]));
    expect(dataSignature([])).toBe("0:");
  });
});
