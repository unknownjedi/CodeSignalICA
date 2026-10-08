# Level 2 — Transfers, Ranking & History

## transfer(fromId, toId, timestamp, amount)

- Moves amount from sender to receiver at timestamp.
- Ignored for unknown workspaces, a self transfer, amount <= 0, or insufficient balance at timestamp.

## getRanking(timestamp)

- Returns canonical workspace ids sorted by transaction volume descending, then id ascending.
- Volume is the total value of all movements at or before timestamp (absolute amounts).

## getTransactions(workspaceId)

- Returns events as { timestamp, type, amount } in timestamp then insertion order.
- amount is signed (positive for credits, negative for debits).
