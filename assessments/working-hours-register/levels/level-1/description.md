# Level 1 — Employee Tracking

> **Project files:** implement `src/working-hours.js`. `src/constants.js` and `src/intervals.js` are read-only helpers you may import.

Build the core of an employee working-hours register.

Your `solution.js` must export a `WorkingHours` class:

```javascript
class WorkingHours {
  addEmployee(id, position) {}

  record(employeeId, timestamp, type) {}

  getWorkingTime(employeeId) {}
}

module.exports = WorkingHours;
```

Timestamps are integers on a shared clock, measured in **minutes**. Working time is
measured in the same unit.

## addEmployee(id, position)

Registers a new employee.

- `id` (string) — unique employee identifier.
- `position` (string) — the employee's position.

If an employee with the same `id` already exists, the call is ignored and the
existing employee is left unchanged.

## record(employeeId, timestamp, type)

Records a badge event for an employee.

- `type` is `"enter"` or `"exit"`.
- `timestamp` (integer) is when the event happened.

Rules:

- Unknown employee → ignored.
- Unknown `type` → ignored.
- `"enter"` while the employee is already inside → ignored.
- `"exit"` while the employee is not inside → ignored.
- A valid `"exit"` completes the session that began at the matching `"enter"`.
- A completed session adds `max(0, exitTimestamp - enterTimestamp)` minutes to the
  employee's total working time. Out-of-order timestamps are therefore allowed; a
  session whose exit precedes its enter contributes `0`.

## getWorkingTime(employeeId)

Returns the employee's total completed working time.

- Incomplete sessions (entered but never exited) do not count.
- Unknown employee → `0`.

## Constraints

- Events are applied in the order `record` is called, regardless of their timestamps.
- Multiple employees are tracked independently.
- Repeated enter/exit cycles accumulate.

## Example

```javascript
const system = new WorkingHours();

system.addEmployee("john", "Engineer");

system.record("john", 10, "enter");
system.record("john", 25, "exit");

system.record("john", 40, "enter");
system.record("john", 55, "exit");

system.getWorkingTime("john"); // 30
```
