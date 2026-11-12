const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(dollars: number): string {
  return usd.format(dollars);
}

/** e.g. 27 -> "27 cm (10.6 in)" */
export function formatPlateSize(cm: number): string {
  return `${cm} cm (${(cm / 2.54).toFixed(1)} in)`;
}

/** Reads ?table= and returns a short, safe label, or null. */
export function parseTableLabel(value: string | null): string | null {
  if (!value) return null;
  const label = value.trim().slice(0, 20);
  return /^[\w -]+$/.test(label) ? label : null;
}
