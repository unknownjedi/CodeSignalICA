# Level 3 — Promotions & Historical Salary

> **Project files:** implement `src/working-hours.js`. `src/constants.js` and `src/intervals.js` are read-only helpers you may import.

Extend the register with promotions and salary calculation.

The API from Levels 1 and 2 is unchanged:

```javascript
system.addEmployee(id, position);
system.record(employeeId, timestamp, type);
system.getWorkingTime(employeeId);
system.topNEmployees(n, position);
```

Level 3 adds:

```javascript
system.promote(employeeId, newPosition, newSalary);
system.calculateSalary(employeeId, startTime, endTime);
```

## Salaries

- Every employee starts with a salary of `0`.
- A salary is an integer amount **per minute** (the same time unit as timestamps).
- A salary only changes through an activated promotion.

## promote(employeeId, newPosition, newSalary)

Requests a promotion for an employee.

- Unknown employee → ignored.
- The promotion is **pending** and does **not** take effect immediately.
- It becomes active on the employee's **next successful entry**: the next
  `record(employeeId, timestamp, "enter")` that moves the employee from outside to
  inside.
- At that moment the employee's position and salary update, and the session started
  by that entry is already paid at the new salary.
- If the employee is currently inside, the current session keeps the old salary; the
  promotion activates on the following successful entry.
- If several promotions are requested before one activates, only the **most recent**
  one applies. Each `promote` call replaces the previous pending promotion.
- A pending promotion that never gets a successful entry never activates.
- Pending promotions do not change the employee's current position (this matters for
  `topNEmployees`).

## calculateSalary(employeeId, startTime, endTime)

Returns the salary earned by the employee for completed sessions, restricted to the
window `[startTime, endTime]`.

For each completed session, with `enter`, `exit`, and `rate` (the salary that was
effective when the session started):

```text
overlap = max(0, min(exit, endTime) - max(enter, startTime))
contribution = rate * overlap
```

`calculateSalary` returns the sum of all contributions.

- Boundaries are inclusive, so a session that ends exactly at `startTime` contributes
  nothing, and a window touching a session's edge contributes nothing extra.
- If `endTime <= startTime` → `0`.
- Unknown employee → `0`.
- Incomplete sessions (entered but never exited) are not counted.

## Regression requirements

- `getWorkingTime` keeps its Level 1 behavior.
- `topNEmployees(position)` uses the employee's **current** position, so a promotion
  that has activated moves the employee to the new position.

## Example

```javascript
const system = new WorkingHours();

system.addEmployee("john", "Engineer");

system.promote("john", "Senior Engineer", 10);

system.record("john", 0, "enter");
system.record("john", 100, "exit"); // paid at 10/min → 1000

system.promote("john", "Staff Engineer", 20);

system.record("john", 200, "enter");
system.record("john", 300, "exit"); // paid at 20/min → 2000

system.calculateSalary("john", 0, 300);   // 3000
system.calculateSalary("john", 0, 150);   // 1000 + 20*50 = 2000
system.calculateSalary("john", 100, 200); // 0 (gap between sessions)

system.topNEmployees(1, "Engineer");       // []
system.topNEmployees(1, "Staff Engineer"); // ["john"]
```
