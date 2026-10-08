# Level 1 — Accounts & Deposits

Build a time-aware in-memory banking system. All amounts are integers.

## createAccount(accountId)

- Creates an account with balance 0. Duplicate accountId is ignored.

## deposit(accountId, amount)

- Adds amount to the account balance and to its transaction volume.
- Unknown account or amount <= 0 is ignored.

## getBalance(accountId)

- Returns the current balance, or 0 for an unknown account.
