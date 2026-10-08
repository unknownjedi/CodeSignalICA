# Industry Coding Assessments

A local, single-user coding assessment platform for interview practice, inspired by
the workflow of CodeSignal-style industry coding assessments. Multi-level problems,
public and hidden tests, progressive code carry-forward, persistent progress, and a
built-in timer — all running on your machine with no login and no external services.

## Quick start

Requirements: Node.js >= 20.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Every bundled assessment appears automatically:

| Assessment | Topic |
| ---------- | ----- |
| Working Hours Register | Multi-file workspace: badge tracking, promotions, historical salary, double-pay |
| Task Management System | Tasks, search/ordering, users with quotas, expiring assignments |
| Cloud/File Storage System | Files, prefix/suffix search, capacity, ownership, compression |
| Time-Aware Banking System | Accounts, volume ranking, two-step transfers, account merging |
| Timestamped Workspace Credit Ledger | Deposits, transfers, spending, delayed cashback, merges |
| In-Memory Object Manager with TTL | Object CRUD, TTL expiration, versioned history, snapshots |

## How it works

- **Assessment list** — every assessment found under `assessments/` is listed with its
  duration, level count, and progress.
- **Modes** — when you begin an assessment you choose:
  - **Practice** — no timer.
  - **Assessment** — a countdown based on the configured duration. The clock starts on
    first open, cannot be paused, and persists across refreshes. When it expires you
    can keep inspecting your code and results.
- **Workspace** — a left sidebar with the task list (levels) and the workspace file
  tree, the Monaco editor in the middle with file tabs, and a right panel that switches
  between the problem statement and test results. Read-only ("locked") files are shown
  with a lock and cannot be edited.
- **Progressive levels** — opening a level for the first time seeds your code from the
  previous level and merges in any newly introduced API methods. Your existing
  implementation is never overwritten.
- **Run Tests** — executes public tests only (fast feedback).
- **Submit** — executes public and hidden tests. A level is passed only when all tests
  pass. If you edit code after passing, the UI warns that the code differs from your
  last passing submission; the historical pass is kept.
- **Persistence** — code, attempts, progress, and timer state are stored in SQLite at
  `~/.industry-coding-assessments/assessment.db` (override with `CODEASSESSMENT_DATA_DIR`).
  Close the browser and come back at any time.
- **Keyboard shortcuts** — `Cmd/Ctrl+S` saves, `Cmd/Ctrl+Enter` runs tests.

## Adding an assessment

Assessments live in the repository. To add one, create a directory:

A level is a **workspace**: a set of files, some editable and some read-only
(locked). The candidate sees the whole workspace, but can only edit the files marked
editable.

```text
assessments/
└── my-assessment/
    ├── metadata.json
    ├── README.md
    └── levels/
        ├── level-1/
        │   ├── description.md        # candidate-facing problem statement (Markdown)
        │   ├── workspace.json        # manifest: entry point + which files are editable
        │   ├── files/                # initial workspace (everything the candidate sees)
        │   │   ├── README.md         # read-only
        │   │   └── src/
        │   │       ├── helper.js     # read-only
        │   │       └── solution.js   # editable (the entry point)
        │   ├── solution/             # reference solution for editable files only
        │   │   └── src/
        │   │       └── solution.js
        │   ├── tests.public.js       # visible tests
        │   └── tests.hidden.js       # hidden tests
        └── level-2/
            └── ...
```

Restart the app. No database editing and no application code changes are required.

> **Single-file levels.** If a level has no `workspace.json`, the platform treats
> `starter.js` as the one editable file (`solution.js`) and `solution.js` as its
> reference solution. This keeps very simple questions easy to author.

### `metadata.json`

```json
{
  "id": "my-assessment",
  "title": "My Assessment",
  "description": "One-line summary shown in the assessment list.",
  "durationMinutes": 90,
  "language": "javascript",
  "levels": [
    { "level": 1, "title": "First level", "difficulty": "easy", "timeoutMs": 5000 },
    { "level": 2, "title": "Second level", "difficulty": "hard", "timeoutMs": 5000 }
  ]
}
```

The `id` must match the directory name. There must be exactly one metadata entry per
`levels/level-N` directory.

### `workspace.json`

```json
{
  "entry": "src/solution.js",
  "files": [
    { "path": "README.md", "editable": false },
    { "path": "src/helper.js", "editable": false },
    { "path": "src/solution.js", "editable": true }
  ]
}
```

- Every `path` must exist under the level's `files/` directory.
- Every **editable** path must have a reference solution under `solution/`.
- The `entry` must be an editable path; it is the entry module handed to tests.
- `README.md` (and any other locked file) is shown in the editor but cannot be edited.

When a candidate opens a level for the first time, its editable files are seeded from
the level template and any methods/declarations that exist in the template but are
missing from the candidate's previous-level code are merged in (existing code is never
overwritten).

### Test format

Test files are CommonJS and export an array of test definitions. Import the entry
module by its workspace path:

```javascript
const Solution = require("./src/solution");

module.exports = [
  {
    id: "basic-case",
    name: "Handles the basic case",
    run(t) {
      const instance = new Solution();
      t.eq(instance.run(2), 4);
    },
  },
];
```

The harness provides a deliberately small assertion API:

- `t.eq(actual, expected, label?)` — deep equality (objects, arrays, NaN)
- `t.ok(value, label?)` — truthy check
- `t.throws(fn, label?)` — expects the function to throw
- `t.fail(message)` — explicit failure

`run` may be async and receives `(t, entry)`, where `entry` is a freshly required copy
of the level's entry module. The whole workspace is reloaded for every test, so module
state cannot leak between tests.

Rules for assessment authors:

- Every level needs public tests, hidden tests, and a reference solution.
- Hidden test inputs, outputs, and names are never exposed through the API or UI.
- Tests must be deterministic: no wall-clock time, no network, no filesystem.
- Later levels must include regression tests for earlier levels.
- Resolve ambiguous behavior in `description.md` and cover it in tests.

### Execution model

Candidate code runs in a dedicated Node.js child process per execution with a fresh
temporary working directory, a memory cap, a configurable timeout, and no access to
the application process. On timeout the process is killed and remaining tests are
marked `skipped`.

`console.log` (and `console.warn`/`console.error`) output from your solution is captured
and shown under each public test result in the **Tests** panel — handy for debugging.
Use `console.log` rather than writing to `process.stdout` directly. Output produced while
hidden tests run is captured for execution but never exposed in the UI or API.

## Verification

```bash
npm run verify
```

Validates every assessment package and runs each level's reference solution through
its public and hidden tests. Exits with a non-zero code if any assessment has invalid
metadata, missing files, empty test suites, or a failing reference solution.

## Development

```bash
npm run dev        # start the app
npm run build      # production build
npm test           # platform tests (Vitest)
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm run verify     # validate assessment packages
```

`dev` and `build` run with webpack (`--webpack`). Turbopack's dev HMR on this setup
recompiles the assessment page on every request and forces a reload loop; webpack is
stable. Tailwind CSS v4 is wired through `postcss.config.mjs`.

## Architecture

- **Filesystem is the source of truth** for assessment content: descriptions, starter
  code, tests, solutions, and metadata.
- **SQLite is the source of truth** for user state: candidate code, progress, attempts,
  execution results, and timer state. It is created and migrated automatically on
  startup at `~/.industry-coding-assessments/assessment.db`. It is stored outside the
  project so the dev server's file watcher never recompiles on database writes.
- Assessment content is completely separated from the platform: the platform is the
  reusable engine, and `assessments/` is the content.
