# Level 4 — Completion & Overdue

Add completion and overdue reporting.

## completeTask(userId, taskId, timestamp)

- Marks the active assignment of taskId to userId as completed at timestamp.
- Ignored if there is no active assignment for that user and task at timestamp.

## getOverdueAssignments(timestamp)

- Returns task ids whose assignment is still active but has expired (expiresAt <= timestamp).
- Sorted ascending.
- Completed assignments are never overdue.

After a task is completed or expires it may be assigned again.
