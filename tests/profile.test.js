import { describe, it, expect } from "vitest";
import { shouldSwapSides, firstName } from "../src/matchtracker/profile.js";

const m = (a, b) => ({ team1: { names: a }, team2: { names: b } });

describe("strona guzika głównego zawodnika", () => {
  it("prawo: zawodnik w drużynie 1 -> zamiana, w drużynie 2 -> bez zamiany", () => {
    const p = { name: "Paweł Mesznik", side: "right", others: false };
    expect(shouldSwapSides(p, m(["Paweł Mesznik"], ["Jan Kowalski"]))).toBe(true);
    expect(shouldSwapSides(p, m(["Jan Kowalski"], ["Mesznik Paweł"]))).toBe(false);
  });
  it("lewo: odwrotnie", () => {
    const p = { name: "Paweł Mesznik", side: "left", others: false };
    expect(shouldSwapSides(p, m(["Paweł Mesznik"], ["X Y"]))).toBe(false);
    expect(shouldSwapSides(p, m(["X Y"], ["Paweł Mesznik"]))).toBe(true);
  });
  it("tryb innych osób, brak imienia, zawodnik poza meczem: bez zamiany", () => {
    expect(shouldSwapSides({ name: "Paweł Mesznik", side: "right", others: true }, m(["Paweł Mesznik"], ["A"]))).toBe(false);
    expect(shouldSwapSides({ name: "", side: "right", others: false }, m(["A"], ["B"]))).toBe(false);
    expect(shouldSwapSides({ name: "Paweł Mesznik", side: "right", others: false }, m(["A"], ["B"]))).toBe(false);
  });
  it("debel: partner też liczy się jako drużyna głównego", () => {
    const p = { name: "Paweł Mesznik", side: "right", others: false };
    expect(shouldSwapSides(p, m(["Anna Nowak", "Paweł Mesznik"], ["A B", "C D"]))).toBe(true);
  });
  it("firstName", () => { expect(firstName("Paweł Mesznik")).toBe("Paweł"); expect(firstName("")).toBe(""); });
});
