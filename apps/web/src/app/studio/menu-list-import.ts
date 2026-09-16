/**
 * Import a list beside Add. Owner file only — never a sample product.
 */

export type ImportedMenuRow = {
  label: string;
  unitPrice: number;
  category: string;
};

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/^[R$£€]\s*/i, '').replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function splitRow(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
  const cells: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.join(' ').toLowerCase();
  return /\b(name|item|dish|label)\b/.test(joined) && /\b(price|zar|cost)\b/.test(joined);
}

export function parseMenuList(text: string): ImportedMenuRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const rows: ImportedMenuRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    if (i === 0 && looksLikeHeader(cells)) continue;
    const label = (cells[0] ?? '').trim();
    const price = parsePrice(cells[1] ?? '');
    const category = (cells[2] ?? '').trim() || 'Food';
    if (!label || price == null) continue;
    rows.push({ label, unitPrice: price, category });
  }
  return rows;
}
