# Working Hours Register — Project

A small employee working-hours and payroll system, built up across four levels.

```
src/
  working-hours.js   ← the only file you edit
  constants.js       ← shared event types (read-only)
  intervals.js       ← interval math helpers (read-only)
```

## Rules

- Implement everything in `src/working-hours.js`, exporting the `WorkingHours` class.
- `src/constants.js` and `src/intervals.js` are **read-only**. You can read and
  import them, but you cannot edit them.
- Your work carries forward between levels. When you open the next level, your
  existing implementation is preserved and any newly required methods are added
  as stubs.
- Tests run against your current implementation. Nothing outside `src/` is graded.

You may use the provided helpers or write your own logic — the helper files are a
convenience, not a requirement.
