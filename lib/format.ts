const whole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** $18 for whole dollars, $52.90 (never $52.9) otherwise. */
export function formatPrice(dollars: number): string {
  return Number.isInteger(dollars) ? whole.format(dollars) : cents.format(dollars);
}

/** e.g. 27 -> "27 cm (10.6 in)" */
export function formatPlateSize(cm: number): string {
  return `${cm} cm (${(cm / 2.54).toFixed(1)} in)`;
}

/** e.g. 8.8 -> "8.8 cm (3.5 in)" */
export function formatLength(cm: number): string {
  return `${cm} cm (${(cm / 2.54).toFixed(1)} in)`;
}

/** Reads ?table= and returns a short, safe label, or null. */
export function parseTableLabel(value: string | null): string | null {
  if (!value) return null;
  const label = value.trim().slice(0, 20);
  return /^[\w -]+$/.test(label) ? label : null;
}
