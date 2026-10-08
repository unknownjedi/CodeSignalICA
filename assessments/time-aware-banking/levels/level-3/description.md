# Level 3 — Transfers

Transfers are two-step: initiate, then accept.

## initiateTransfer(transferId, fromId, toId, amount, timestamp, expiresAt)

- Creates a pending transfer and moves amount from the sender's balance into escrow.
- Ignored if the transferId already exists, the accounts are unknown, sender and receiver are the same,
  the amount is <= 0, or the sender's balance is less than amount.

## acceptTransfer(transferId, timestamp)

- If timestamp is at or after expiresAt, the transfer is marked expired and the amount is refunded to the sender.
- Otherwise the receiver is credited, the transfer is marked accepted, and volume is added to both accounts.
- Accepting a transfer that is not pending is ignored.

## getTransferStatus(transferId)

- Returns 'pending', 'accepted', 'expired', or null.
