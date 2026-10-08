# Level 1 — Tasks

Build an in-memory task manager that stores tasks and lets you add, update, and retrieve them.

Your solution.js must export a TaskManager class with the methods listed in the starter code.

## addTask(id, name, priority)

- Adds a task identified by the string id.
- priority is an integer; a larger number means a more important task.
- If a task with the same id already exists, the call is ignored and the existing task is unchanged.

## updateTask(id, updates)

- updates is an object that may contain a name and/or a priority field.
- Only the fields present in updates are changed.
- Unknown id, or missing updates, is ignored.

## getTask(id)

- Returns a copy of the task as { id, name, priority }.
- Returns null for an unknown id.
- Mutating the returned object must not change stored state.
