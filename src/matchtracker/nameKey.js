// Tennis Tracker — klucz nazwiska odporny na zapis. "Jan Kowalski",
// "kowalski jan", "KOWALSKI  Jan" i "Jan Kowalski" bez polskich znaków to ten
// sam zawodnik: ignorujemy wielkość liter, spacje, ogonki i KOLEJNOŚĆ słów
// (imię + nazwisko albo nazwisko + imię).
export function normName(n) {
  return String(n || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l").replace(/Ł/g, "L")
    .toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim()
    .split(" ").filter(Boolean).sort().join(" ");
}

export const sameName = (a, b) => normName(a) !== "" && normName(a) === normName(b);

// Czyści spacje; nie zmienia kolejności ani wielkości liter.
export const cleanName = (n) => String(n || "").replace(/\s+/g, " ").trim();
