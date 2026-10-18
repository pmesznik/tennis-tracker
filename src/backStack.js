// Stos "zamykaczy" nakładek dla przycisku "wstecz" Androida (patrz
// MainActivity.java i window.appBack w App.jsx): najwyższa otwarta nakładka
// (okno, szuflada) zamyka się pierwsza, dopiero potem ekran, a na końcu
// aplikacja.
const stack = [];

export function pushBack(fn) {
  stack.push(fn);
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i !== -1) stack.splice(i, 1);
  };
}

export function popBack() {
  const fn = stack.pop();
  if (!fn) return false;
  fn();
  return true;
}
