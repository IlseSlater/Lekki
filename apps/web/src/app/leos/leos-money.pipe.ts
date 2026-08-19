import { Pipe, PipeTransform } from '@angular/core';

/**
 * Guest-facing money — ZAR shows as R45.00 (not ZAR45.00).
 */
@Pipe({ name: 'leosMoney', standalone: true, pure: true })
export class LeosMoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'ZAR'): string {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    const amount = n.toFixed(2);
    if (!currency || currency === 'ZAR') return `R${amount}`;
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
      }).format(n);
    } catch {
      return `${currency}${amount}`;
    }
  }
}
