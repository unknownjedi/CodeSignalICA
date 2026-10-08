# Level 3 — History

## getAt(key, timestamp)

- Returns the value that was current at timestamp: the latest version written at or before timestamp,
  provided that version had not expired at timestamp.

## history(key)

- Returns every version as { value, timestamp, expiresAt } in timestamp then insertion order.
