# Level 2 — Name Search

Add name searches with a deterministic ordering. Names are matched case-sensitively.

## findByPrefix(prefix)

- Returns the names of all files whose name starts with prefix.

## findBySuffix(suffix)

- Returns the names of all files whose name ends with suffix.
- An empty prefix or suffix matches every file.

## Ordering

- Both searches sort results by size descending, then by name ascending.
