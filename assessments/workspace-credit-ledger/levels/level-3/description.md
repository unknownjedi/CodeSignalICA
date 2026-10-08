# Level 3 — Spending & Delayed Cashback

## spend(workspaceId, timestamp, amount, cashbackAmount, cashbackDelay)

- Debits amount at timestamp; ignored for unknown workspace, amount <= 0, or insufficient balance at timestamp.
- If cashbackAmount > 0, schedules a cashback credit at timestamp + cashbackDelay.

## getCashback(workspaceId, timestamp)

- Returns the total cashback credited at or before timestamp.

The cashback only affects balances at or after timestamp + cashbackDelay.
