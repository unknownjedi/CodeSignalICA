# Level 3 — Users, Quotas & Assignments

Add users, quotas, and time-limited task assignments.

## addUser(userId, quota)

- Registers a user who may hold at most quota active assignments.
- Duplicate userId is ignored.

## assignTask(userId, taskId, timestamp, ttl)

- Assigns a task to a user starting at timestamp, expiring at timestamp + ttl.
- An assignment is active at time T when its status is active and expiresAt > T.
- Unknown user or task is ignored.
- A task that already has an active assignment is ignored.
- If the user already holds quota active assignments at timestamp, the call is ignored.
- ttl <= 0 produces an assignment that is already expired.

## getAssignments(userId, timestamp)

- Returns the task ids actively assigned to the user at timestamp, sorted ascending.
