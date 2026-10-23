/*
 * Die Währung heißt Bytes. Ab 1.000 zeigen wir Kilobyte an – „Kilo heißt
 * tausend, wie beim Kilogramm". Die 1.024er-Rechnung kommt erst im Bit-Labor
 * für die Großen; für den Anfang ist das Dezimalsystem ehrlicher und einfacher.
 */

const oneDecimal = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

export function formatBytes(n: number): string {
  const value = Math.max(0, Math.floor(n));
  if (value === 1) return '1 Byte';
  if (value < 1000) return `${value} Bytes`;
  if (value < 1_000_000) return `${oneDecimal.format(floorTo(value / 1000, 1))} KB`;
  return `${oneDecimal.format(floorTo(value / 1_000_000, 1))} MB`;
}

/** Kurzform für knappe Stellen wie die Taskleiste. */
export function formatBytesShort(n: number): string {
  const value = Math.max(0, Math.floor(n));
  if (value < 1000) return `${whole.format(value)} B`;
  if (value < 1_000_000) return `${oneDecimal.format(floorTo(value / 1000, 1))} KB`;
  return `${oneDecimal.format(floorTo(value / 1_000_000, 1))} MB`;
}

// Abrunden statt runden: 999 Bytes sollen nicht schon als „1 KB" erscheinen.
function floorTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.floor(value * f) / f;
}
