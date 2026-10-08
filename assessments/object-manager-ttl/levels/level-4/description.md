# Level 4 — Snapshots

## snapshot(snapshotId)

- Saves a deep copy of the current state under snapshotId. Reusing an id overwrites it.

## restore(snapshotId)

- Replaces the current state with the saved snapshot. Unknown id is ignored.

## listSnapshots()

- Returns snapshot ids sorted ascending.
