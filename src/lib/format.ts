/** Treasury style: R2 716.9bn, space as the thousands separator. */

export function formatBn(value: number, digits = 1): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  const [whole, frac] = abs.toFixed(digits).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return frac ? `${sign}R${grouped}.${frac}bn` : `${sign}R${grouped}bn`;
}

export function formatRand(value: number): string {
  const sign = value < 0 ? "−" : "";
  const rounded = Math.round(Math.abs(value));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}R${grouped}`;
}

export function formatPeople(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const text = m >= 10 ? m.toFixed(1) : m.toFixed(1);
    return `${text.replace(".", ",")} million`;
  }
  return value.toLocaleString("en-ZA");
}

export function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function share(part: number, whole: number): number {
  if (!whole) return 0;
  return (part / whole) * 100;
}
