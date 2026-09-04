# Money invariant table

Assert in `node:test` (`*.test.ts`). Exact cents. No epsilon.

**Covered** means the file is picked up by `apps/runtime/package.json` `"test"`
(`src/leos/*.test.ts`). **Open** means it is not proven yet.

| # | Invariant | Case | Must hold | Status |
|---|-----------|------|-----------|--------|
| 1 | Equal split settles to zero | R100 ÷ 3 | `33.33 + 33.33 + 33.34 == 100.00` minor | covered (`money.test.ts`) |
| 2 | Last payer inherits remainder | R100 ÷ 3, pay in order | 3rd owes `33.34`; bill then fully paid | partial |
| 3 | Multi-transaction visit | starters 200 + mains 150 | quoted == charged (`350`) | covered (`settlement.test.ts`) |
| 4 | Tip computed on server base | 15% on a 2-tx visit of 350 | tip == 15% of 350, server-side | covered (`payment-invariants.test.ts`) |
| 5 | Concurrent full payment | two payers, same instant | total charged once (not 2×350) | **closed by constraint** — session `billMinor`/`paidMinor`/`version` + pending unique indexes + `expiresAt` release; late ITN after expiry re-takes capacity or flags `needs_refund` (`payment-concurrency.test.ts`). |
| 6 | Divisor excludes non-orderers | 4th guest scans, no order | share stays 1/3 | covered (`equal-share-candidates.test.ts`) |
| 7 | Stale participant secret | yesterday's secret | rejected (`Invalid participant credentials`) | covered (`participant-auth.test.ts`; HTTP maps to 401) |
| 8 | Settled bill rejects new payment | pay twice | second refused | covered (`payment-invariants.test.ts`) |
| 9 | Decimal boundary | 33.333 → storage / minor | never widens; round via `toMinor` | partial (`toMinor` round-trip) |
| 10 | Refund path exists | request a refund | PayFast stub fails closed; manual is in-process only | **tripwire** (`refund-stub.test.ts`) — `PaymentOverpayment` / `needs_refund` is the first real consumer; fails the day a real refund ships until the assertion is rewritten |

When you close an **open** row, change Status and name the test.
