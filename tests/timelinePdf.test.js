import { describe, it, expect } from "vitest";
import { buildTimeline, sampleIndexes } from "../src/matchtracker/timeline.js";
import { buildPdf } from "../src/matchtracker/pdfWriter.js";
import { PRESETS, DEFAULT_PRESET_KEY } from "../src/matchtracker/scoringEngine.js";

// Mecz do jednego seta (6 gemów): A wygrywa 6:0 samymi asami po 4 punkty.
function matchWith(log) {
  return { rules: { ...PRESETS[DEFAULT_PRESET_KEY], sets: 1, gamesPerSet: 6, tiebreakAt: 6, finalSetSuperTiebreak: false }, pointLog: log, initialServer: "team1" };
}
const pts = (winner, n) => Array.from({ length: n }, () => ({ winner, server: "team1" }));

describe("oś czasu meczu", () => {
  it("brak punktów albo reguł daje null", () => {
    expect(buildTimeline({ rules: null, pointLog: [] })).toBe(null);
    expect(buildTimeline(matchWith([]))).toBe(null);
  });

  it("punkty narastająco, końce setów i kolejność gemów", () => {
    const log = [...pts("team1", 4), ...pts("team2", 4), ...pts("team1", 4)];
    const tl = buildTimeline(matchWith(log));
    expect(tl.a[tl.a.length - 1]).toBe(8);
    expect(tl.b[tl.b.length - 1]).toBe(4);
    expect(tl.a.length).toBe(13);
    expect(tl.games[0]).toEqual(["team1", "team2", "team1"]);
    expect(tl.setEnds).toEqual([]);
  });

  it("koniec seta zapisuje indeks i zwycięzcę ostatniego gemu", () => {
    const log = Array.from({ length: 6 }, () => pts("team1", 4)).flat();
    const tl = buildTimeline(matchWith(log));
    expect(tl.setEnds).toEqual([24]);
    expect(tl.games[0]).toEqual(Array(6).fill("team1"));
  });

  it("próbkowanie zachowuje pierwszy i ostatni punkt", () => {
    const idx = sampleIndexes(1000, 100);
    expect(idx).toHaveLength(100);
    expect(idx[0]).toBe(0);
    expect(idx[99]).toBe(1000);
    expect(sampleIndexes(5, 100)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("zapis PDF", () => {
  it("składa poprawny plik z poprawną tablicą xref", () => {
    const jpg = { data: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), width: 10, height: 20 };
    const out = buildPdf([jpg, jpg]);
    const s = Array.from(out).map((b) => String.fromCharCode(b)).join("");
    expect(s.startsWith("%PDF-1.4")).toBe(true);
    expect(s.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(s).toContain("/Count 2");
    const start = parseInt(s.match(/startxref\n(\d+)/)[1], 10);
    expect(s.slice(start, start + 4)).toBe("xref");
    const offs = [...s.slice(start).matchAll(/(\d{10}) 00000 n/g)].map((m) => parseInt(m[1], 10));
    expect(offs).toHaveLength(8);
    offs.forEach((o, i) => expect(s.slice(o, o + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
  });
});
