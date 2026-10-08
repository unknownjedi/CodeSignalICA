# Level 1 — Workspaces & Deposits

Build a timestamped workspace credit ledger. Every operation carries a timestamp and balances are queried at a point in time.

## createWorkspace(workspaceId)

- Creates an empty workspace. Duplicate id is ignored.

## deposit(workspaceId, timestamp, amount)

- Credits amount at timestamp. Unknown workspace or amount <= 0 is ignored.

## getBalance(workspaceId, timestamp)

- Returns the balance considering only events at or before timestamp.
- Unknown workspace returns 0.
