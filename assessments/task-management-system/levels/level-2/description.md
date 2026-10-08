# Level 2 — Search & Ordering

Add listing and searching on top of Level 1.

## listTasks()

- Returns every task id.
- Sorted by priority descending, then by id ascending.

## searchTasks(nameQuery)

- Case-insensitive substring match against the task name.
- Returns matching task ids sorted by priority descending, then id ascending.
- An empty query matches all tasks.
