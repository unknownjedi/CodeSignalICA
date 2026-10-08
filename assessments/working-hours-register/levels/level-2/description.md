# Level 2 — Top N Employees

> **Project files:** implement `src/working-hours.js`. `src/constants.js` and `src/intervals.js` are read-only helpers you may import.

Extend the working-hours register with a ranking query.

The API from Level 1 is unchanged:

```javascript
system.addEmployee(id, position);
system.record(employeeId, timestamp, type);
system.getWorkingTime(employeeId);
```

Level 2 adds:

```javascript
system.topNEmployees(n, position);
```

## topNEmployees(n, position)

Returns the employees with the highest completed working time for a position.

- Considers all employees whose **current position** equals `position`, including
  employees with zero completed working time.
- Sorts them by completed working time **descending**.
- Ties are broken by employee `id` **ascending** (JavaScript string comparison).
- Returns an array of employee `id`s (strings), at most `n` entries.
- If fewer employees match than `n`, all matches are returned.
- `n <= 0` → `[]`.
- Unknown position → `[]`.

Only completed working time counts (same rules as Level 1).

## Example

```javascript
const system = new WorkingHours();

system.addEmployee("john", "Engineer");
system.addEmployee("mary", "Engineer");
system.addEmployee("zoe", "Designer");

system.record("john", 0, "enter");
system.record("john", 30, "exit");

system.record("mary", 0, "enter");
system.record("mary", 10, "exit");

system.record("zoe", 0, "enter");
system.record("zoe", 100, "exit");

system.topNEmployees(2, "Engineer"); // ["john", "mary"]
system.topNEmployees(5, "Engineer"); // ["john", "mary"]
system.topNEmployees(1, "Designer"); // ["zoe"]
system.topNEmployees(3, "Pilot");    // []
```
