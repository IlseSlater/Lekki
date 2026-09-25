/**
 * Minimal CSV serialiser — the data shape here is a flat, known row type,
 * not worth a dependency. RFC 4180 quoting: quote when the field contains
 * a comma, quote, or newline; double any embedded quotes.
 */

export function toCsv<T extends Record<string, string | number>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const lines = [columns.map((c) => quoteCsvField(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => quoteCsvField(String(row[c.key] ?? ''))).join(','));
  }
  return lines.join('\r\n');
}

function quoteCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
