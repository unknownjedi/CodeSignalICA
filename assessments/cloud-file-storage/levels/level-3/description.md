# Level 3 — Users, Capacity & Ownership

Add users with storage capacity and track which files they own.

## addUser(userId, capacity)

- Registers a user who may own at most capacity bytes.
- Duplicate userId is ignored.

## assignOwner(fileName, userId)

- Assigns ownership of a file to a user.
- Unknown file or user is ignored.
- If the move would push the user over capacity, the call is ignored and nothing changes.
- If the file was owned by someone else, that user's usage is released.

## getOwner(fileName)

- Returns the owner id, or null if the file is unowned or unknown.

## getUsage(userId)

- Returns the total size of files owned by the user; 0 for an unknown user.

Copies have no owner. Overwriting an owned file with copyFile releases its owner's usage.
