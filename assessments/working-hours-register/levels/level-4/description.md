# Level 4 — Double-Pay Grant Periods

> **Project files:** implement `src/working-hours.js`. `src/constants.js` and `src/intervals.js` are read-only helpers you may import.

Extend the register with special grant periods that pay double.

The API from Levels 1–3 is unchanged:

```javascript
system.addEmployee(id, position);
system.record(employeeId, timestamp, type);
system.getWorkingTime(employeeId);
system.topNEmployees(n, position);
system.promote(employeeId, newPosition, newSalary);
system.calculateSalary(employeeId, startTime, endTime);
```

Level 4 adds:

```javascript
system.addDoublePayPeriod(start, end);
system.getAdditionalCompensation(employeeId, startTime, endTime);
```

## addDoublePayPeriod(start, end)

Registers a period `[start, end]` during which working time earns double pay.

- `end < start` → the call is ignored.
- `start === end` → accepted, but has no effect (zero-length).
- Periods may overlap. Overlapping parts are only counted **once**.
- Periods may be added at any time. They apply to **all completed sessions**,
  including sessions that happened before the period was registered (compensation is
  evaluated when `getAdditionalCompensation` is called).

## getAdditionalCompensation(employeeId, startTime, endTime)

Returns the **additional** compensation earned on top of normal salary, for the window
`[startTime, endTime]`.

For each completed session, with `enter`, `exit`, and `rate` (the salary effective
when the session started):

```text
covered = length of ( [max(enter, startTime), min(exit, endTime)] ∩ union(periods) )
contribution = rate * covered
```

`getAdditionalCompensation` returns the sum of all contributions.

- Total pay for a window = `calculateSalary(...) + getAdditionalCompensation(...)`.
- Overlapping periods are merged (union) before intersecting with the session, so a
  minute inside two overlapping periods is paid only once.
- Boundaries are inclusive; touching a boundary contributes nothing extra.
- If `endTime <= startTime` → `0`.
- Unknown employee → `0`.
- No periods → `0`.
- Incomplete sessions are not counted.

## Example

```javascript
const system = new WorkingHours();

system.addEmployee("john", "Engineer");

system.promote("john", "Senior", 10);
system.record("john", 0, "enter");
system.record("john", 100, "exit"); // 1000 normal pay

system.addDoublePayPeriod(50, 100);

system.calculateSalary("john", 0, 100);            // 1000
system.getAdditionalCompensation("john", 0, 100); // 500
// total pay = 1500

system.addDoublePayPeriod(80, 120); // overlaps [50, 100]
system.getAdditionalCompensation("john", 0, 100); // 600 (union is [50, 100])
```
