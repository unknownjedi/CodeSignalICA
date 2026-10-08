# Industry Coding Assessment Platform

## 1. Overview

Build a **local, single-user coding assessment platform** inspired by the workflow and UI of CodeSignal's industry coding assessments.

The platform is intended for interview preparation.

The user will provide an AI coding agent with a real-world coding assessment description such as:

> Working Hours Register — 90 minutes, 4 levels  
> Level 1: Add employees, record badge events, calculate working time  
> Level 2: Top N employees  
> Level 3: Promotions and historical salary  
> Level 4: Double-pay grant periods

The coding agent must be able to create a complete assessment package from that description:

- Problem description
- Multiple levels
- API/function contract
- Starter code
- Public test cases
- Hidden test cases
- Edge cases
- Reference solutions
- Metadata
- Level configuration
- Test execution configuration

The platform then loads those assessments and lets the user solve them locally in a browser.

---

# 2. Goals

## Primary goals

1. Provide a realistic industry coding assessment experience.
2. Support multi-level progressive coding problems.
3. Execute JavaScript solutions locally.
4. Provide public and hidden tests.
5. Persist problems, code, attempts, and progress in SQLite.
6. Allow the user to return to an unfinished problem at any time.
7. Make adding new assessments extremely easy.
8. Keep the platform simple and local.

## Non-goals

Do NOT build:

- User authentication
- User registration
- Cloud deployment
- Social features
- Leaderboards
- Teams
- Collaboration
- Payments
- Email
- Notifications
- Profiles
- Chat
- Admin dashboards
- Online judge infrastructure
- Multi-language support
- Python/Java/C++/Go/Rust support
- External databases
- External APIs
- Unnecessary gamification

This is a **personal local interview-practice tool**.

---

# 3. Technology Stack

Use:

### Frontend

- Next.js
- React
- TypeScript for the application itself
- Monaco Editor for the code editor
- Modern CSS or Tailwind CSS

### Backend

Use the Next.js application as the backend.

Do not introduce a separate backend service unless absolutely necessary.

### Database

- SQLite
- Use a lightweight TypeScript/Node SQLite library.
- Prefer Drizzle ORM if an ORM is useful.
- Database should live locally.

### Code execution

Candidate submissions are **JavaScript**.

Use Node.js to execute candidate code.

The execution system must run candidate code in a separate child process rather than directly inside the web server process.

---

# 4. Runtime Requirements

The platform should support:

```text
Node.js >= 20
npm / pnpm
```

The coding agent should provide:

```bash
npm install
npm run dev
```

and the application should become available at:

```text
http://localhost:3000
```

No external services should be required.

---

# 5. Core User Experience

The user opens:

```text
http://localhost:3000
```

They see a list of available coding assessments.

Example:

```text
Industry Coding Assessments

┌──────────────────────────────────────────────┐
│ Working Hours Register                       │
│ 90 minutes · 4 levels · JavaScript           │
│                                              │
│ Multi-level employee working-hours system    │
│                                              │
│ Level 1  Level 2  Level 3  Level 4           │
│                                              │
│                     [ Start / Continue ]      │
└──────────────────────────────────────────────┘
```

Clicking an assessment opens the coding environment.

---

# 6. Assessment UI

The main coding screen should feel similar to modern CodeSignal-style assessment interfaces.

Do not copy CodeSignal's branding, exact design, assets, or proprietary UI.

Use the same general interaction model:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Assessment name                         Level 2       72:41        │
├───────────────────┬─────────────────────────────────┬───────────────┤
│                   │                                 │               │
│   LEVELS          │       CODE EDITOR               │   TESTS       │
│                   │                                 │               │
│   ✓ Level 1      │   function solution(...) {     │   Public      │
│   ● Level 2      │                                 │   ✓ Test 1    │
│   ○ Level 3      │   }                             │   ✓ Test 2    │
│   ○ Level 4      │                                 │   ○ Test 3    │
│                   │                                 │               │
│                   │                                 │   Hidden      │
│                   │                                 │   8 tests     │
│                   │                                 │               │
├───────────────────┴─────────────────────────────────┴───────────────┤
│ Problem / Description                                               │
│                                                                     │
│ [Run Tests]                                      [Submit Level]     │
└─────────────────────────────────────────────────────────────────────┘
```

The exact layout can differ, but the experience should be clean and assessment-focused.

---

# 7. Assessment Navigation

The application should have three primary areas:

## Left panel

Level navigation.

Example:

```text
Working Hours Register

✓ Level 1
  Employee tracking

✓ Level 2
  Top N employees

● Level 3
  Promotions

○ Level 4
  Double-pay grants
```

States:

- `✓` = passed
- `●` = current
- `○` = not attempted

Users should be able to open any level.

Do not force sequential unlocking.

However, the UI should visually communicate progression.

---

# 8. Problem Description

The problem description should be displayed in a readable panel.

Support Markdown.

Example:

```markdown
# Level 1 — Employee Tracking

Build an employee working-hours system.

## addEmployee

Adds an employee...

## record

Records an entry or exit event...

## getWorkingTime

Returns the total completed working time...

### Constraints

...
```

The description should remain visible while coding.

The user should not have to navigate away from the editor to read it.

---

# 9. Function/API-Style Problems

Problems are NOT stdin/stdout competitive programming problems.

They must use a function/class/API contract.

Example:

```javascript
class WorkingHours {
  addEmployee(id, position) {}

  record(employeeId, timestamp, type) {}

  getWorkingTime(employeeId) {}
}

module.exports = WorkingHours;
```

The assessment defines the expected API.

Tests import the candidate implementation and call the API directly.

For example:

```javascript
const WorkingHours = require("./solution");

const system = new WorkingHours();

system.addEmployee("John", "Engineer");

system.record("John", 10, "enter");
system.record("John", 20, "exit");

expect(system.getWorkingTime("John")).toBe(10);
```

The candidate should only need to implement the specified API.

---

# 10. Starter Code

Every level must provide starter code.

Example:

```javascript
class WorkingHours {
  addEmployee(id, position) {
    // TODO
  }

  record(employeeId, timestamp, type) {
    // TODO
  }

  getWorkingTime(employeeId) {
    // TODO
  }
}

module.exports = WorkingHours;
```

Starter code is copied into the candidate workspace when a level is first opened.

After that, the candidate's version becomes persistent.

---

# 11. Multi-Level Architecture

Each assessment can contain an arbitrary number of levels.

Minimum expected support:

```text
Level 1
Level 2
Level 3
Level 4
```

Do not hardcode exactly four levels.

An assessment could have:

```text
2 levels
3 levels
4 levels
5 levels
```

etc.

Each level should contain:

- ID
- Title
- Description
- Starter code
- Public tests
- Hidden tests
- Reference solution
- Test configuration
- Difficulty
- Time allocation if applicable

---

# 12. Progressive Implementation

A critical requirement:

**Candidate code must carry forward between levels.**

Example:

```text
Level 1
candidate.js
   ↓
Level 2
candidate.js + Level 2 additions
   ↓
Level 3
candidate.js + Level 3 additions
   ↓
Level 4
candidate.js + Level 4 additions
```

When moving from Level 1 to Level 2:

- Do not erase the candidate's code.
- Do not replace it with the reference solution.
- Preserve the candidate's implementation.
- Level 2 tests should test the accumulated implementation.

If a level introduces new API methods, starter code should make the new methods available without destroying existing candidate code.

---

# 13. Test Types

Each level supports two categories.

## Public tests

Visible to the user.

The UI should show:

```text
Public tests

✓ Basic employee creation
✓ Single completed shift
✓ Multiple completed shifts
○ Multiple employees
```

The actual inputs/expected outputs may be visible depending on the test definition.

## Hidden tests

Not visible to the candidate.

The UI may show only:

```text
Hidden tests

12 hidden tests
```

After execution:

```text
Hidden tests

✓ 12 / 12 passed
```

Do NOT expose:

- Hidden test inputs
- Hidden expected outputs
- Hidden test source code
- Reference solution

---

# 14. Test Runner

The test runner is one of the most important components.

Candidate code must never execute directly inside the Next.js server process.

Use a child process.

Conceptually:

```text
Browser
   |
   | Run / Submit
   v
Next.js API
   |
   v
Assessment Runner
   |
   v
Temporary execution directory
   |
   +-- candidate.js
   +-- tests.js
   +-- runner.js
   |
   v
Node.js child process
   |
   v
Test results
```

The runner should:

1. Create a temporary directory.
2. Write the candidate's code.
3. Write the selected test suite.
4. Write a test harness.
5. Start a separate Node.js process.
6. Execute tests.
7. Capture stdout/stderr.
8. Enforce a timeout.
9. Return structured results.
10. Delete the temporary directory.

---

# 15. Execution Safety

This is a local personal application, but candidate code must still be isolated from the main application.

At minimum:

- Separate child process
- Execution timeout
- Memory-conscious execution
- No access to application server state
- Temporary working directory
- Kill process on timeout
- Capture stdout/stderr
- Never execute candidate code using `eval()` inside the Next.js server

The candidate code should not be able to crash the main server.

If practical on the target OS, use additional OS-level process restrictions.

Do not over-engineer container orchestration or Docker unless required.

---

# 16. Test Timeout

Every test execution must have a timeout.

Default:

```text
5000 ms
```

Configurable per assessment/level.

If the candidate has an infinite loop:

```javascript
while (true) {}
```

the runner must terminate the child process.

Return:

```json
{
  "status": "timeout",
  "durationMs": 5000
}
```

The UI should display:

```text
Execution timed out.

Your program did not finish within 5 seconds.
```

---

# 17. Test Result Model

Each test should return structured information.

Example:

```json
{
  "id": "basic-shift",
  "name": "Single completed shift",
  "visibility": "public",
  "status": "passed",
  "durationMs": 12
}
```

Possible statuses:

```text
passed
failed
error
timeout
```

For public tests, failures can include useful information:

```text
Expected: 10
Received: 8
```

For hidden tests:

```text
Hidden test failed.
```

Do not reveal hidden assertions.

---

# 18. Run Tests vs Submit

Provide two actions.

## Run Tests

Runs public tests.

Purpose:

- Fast local feedback
- Debugging
- Development

Button:

```text
Run Tests
```

## Submit

Runs:

1. Public tests
2. Hidden tests

A level is considered passed only when all required tests pass.

Button:

```text
Submit
```

---

# 19. Submission Result

Example:

```text
Level 3

✓ Public tests       8 / 8
✓ Hidden tests      24 / 24

Passed

Execution time: 38ms
```

If failed:

```text
Level 3

✓ Public tests        8 / 8
✗ Hidden tests       21 / 24

3 hidden tests failed.

Level not passed.
```

Do not expose hidden test details.

---

# 20. SQLite Persistence

Use SQLite to persist application state.

The database should store at minimum:

## assessments

```text
id
title
description
duration_minutes
language
created_at
updated_at
```

## levels

```text
id
assessment_id
level_number
title
description
difficulty
starter_code
timeout_ms
created_at
```

## candidate_code

```text
id
assessment_id
level_id
code
updated_at
```

## attempts

```text
id
assessment_id
level_id
type
status
passed_tests
total_tests
duration_ms
created_at
```

Where:

```text
type = run | submit
status = passed | failed | error | timeout
```

## test_results

```text
id
attempt_id
test_id
status
duration_ms
error_message
created_at
```

Do not store hidden test inputs or expected results in the database if they are already defined in the filesystem/package.

---

# 21. Resume Behavior

The user must be able to close the browser and return later.

When returning to a level:

- Restore candidate code.
- Restore level progress.
- Show previous submission state.
- Preserve assessment state.

Example:

```text
Working Hours Register

Level 1     ✓ Passed
Level 2     ✓ Passed
Level 3     ● In progress
Level 4     ○ Not started
```

The platform should behave like a persistent local workspace.

---

# 22. Assessment Package Format

Assessments should live in the repository.

Recommended structure:

```text
assessments/
└── working-hours-register/
    ├── metadata.json
    ├── README.md
    └── levels/
        ├── level-1/
        │   ├── description.md
        │   ├── starter.js
        │   ├── tests.public.js
        │   ├── tests.hidden.js
        │   └── solution.js
        │
        ├── level-2/
        │   ├── description.md
        │   ├── starter.js
        │   ├── tests.public.js
        │   ├── tests.hidden.js
        │   └── solution.js
        │
        ├── level-3/
        │   └── ...
        │
        └── level-4/
            └── ...
```

---

# 23. Assessment Metadata

Example:

```json
{
  "id": "working-hours-register",
  "title": "Working Hours Register",
  "description": "Build an employee working-hours system.",
  "durationMinutes": 90,
  "language": "javascript",
  "levels": 4
}
```

Level metadata can contain:

```json
{
  "level": 1,
  "title": "Employee Working Hours",
  "difficulty": "medium",
  "timeoutMs": 5000
}
```

---

# 24. Agent-Assisted Assessment Creation

The platform must be designed around the assumption that an AI coding agent will create assessment packages.

The agent may receive an informal specification:

```text
Working Hours Register — VERY IMPORTANT

90 minutes, 4 levels

Build an employee working-hours system.

Level 1
- Add employees.
- Record badge entry/exit events.
- Calculate an employee's completed working time.

Level 2
- Return the top N employees by working time...

Level 3
...
```

The agent should transform this into:

```text
assessments/
└── working-hours-register/
    ├── metadata.json
    ├── README.md
    └── levels/
        ├── level-1/
        ├── level-2/
        ├── level-3/
        └── level-4/
```

The agent is responsible for generating:

### Problem description

Clear candidate-facing instructions.

### API specification

Explicit methods, parameters, return values, and behavior.

### Starter implementation

Minimal skeleton that compiles/runs.

### Public tests

Representative examples.

### Hidden tests

Comprehensive edge cases.

### Reference solution

Correct implementation used for validating the assessment itself.

### Metadata

Duration, levels, difficulty, language, etc.

---

# 25. Assessment Creation Quality Requirements

The AI agent must NOT simply generate random tests.

Tests should cover:

- Normal cases
- Boundary cases
- Empty input where applicable
- Multiple entities
- Repeated operations
- Ordering issues
- Invalid operations if the specification defines them
- Large inputs
- State transitions
- Historical behavior
- Cross-level regression

For multi-level assessments, every level must include regression tests for functionality from earlier levels.

---

# 26. Reference Solutions

Every level should contain a reference solution.

The reference solution is used to verify that:

1. The tests actually pass.
2. The test suite is meaningful.
3. Hidden tests catch incorrect implementations.

The assessment creation agent must run:

```text
reference solution
        ↓
public tests
        ↓
hidden tests
```

before considering the assessment complete.

The reference solution must pass all tests.

---

# 27. Mutation / Negative Testing

When generating an assessment, the coding agent should ideally verify that hidden tests can catch common incorrect implementations.

Examples:

- Off-by-one errors
- Incorrect sorting
- Ignoring historical state
- Applying promotions immediately
- Applying promotion to the wrong shift
- Incorrect interval overlap handling
- Counting incomplete sessions
- Incorrect double-pay calculation

This is particularly important for industry-style multi-level problems.

---

# 28. Working Hours Register Example

The platform should support an assessment equivalent to:

```text
Working Hours Register

Duration: 90 minutes
Levels: 4
Language: JavaScript
```

## Level 1

Features:

- Add employees
- Record badge entry events
- Record badge exit events
- Calculate completed working time

Example API:

```javascript
system.addEmployee(id, position);

system.record(employeeId, timestamp, "enter");

system.record(employeeId, timestamp, "exit");

system.getWorkingTime(employeeId);
```

## Level 2

Add:

```javascript
system.topNEmployees(n, position);
```

Return the employees with the highest completed working time for the requested position.

## Level 3

Add employee promotions.

Promotion behavior:

- A promotion does not become active immediately.
- It becomes effective on the employee's next successful office entry.
- Historical completed sessions retain the salary that was effective during that session.
- Salary calculations over intervals must use the correct historical salary.

Example APIs may include:

```javascript
system.promote(employeeId, newPosition, newSalary);

system.calculateSalary(employeeId, startTime, endTime);
```

The exact API should be defined clearly in the generated assessment specification.

## Level 4

Add special/grant periods with double pay.

The implementation must:

- Store special periods.
- Determine which completed shifts qualify.
- Calculate additional compensation.
- Avoid double-counting.
- Correctly handle overlapping or boundary intervals according to the assessment specification.

Example:

```javascript
system.addDoublePayPeriod(start, end);

system.getAdditionalCompensation(employeeId, start, end);
```

The exact semantics must be explicitly specified in the candidate-facing problem statement and tests.

---

# 29. Timer

Support two modes.

## Practice mode

No countdown.

The user can solve the problem whenever they want.

## Assessment mode

Use the assessment's configured duration.

Example:

```text
90:00
```

The timer should persist across page refreshes.

The timer must be based on timestamps stored in SQLite rather than only browser state.

Do not automatically delete or lock the assessment when the timer reaches zero.

When time expires:

```text
Time expired
```

The user may still inspect their code and results.

Since this is a personal practice application, do not implement punitive behavior.

---

# 30. Code Editor

Use Monaco Editor.

Requirements:

- JavaScript syntax highlighting
- Line numbers
- Code formatting support where practical
- Search
- Replace
- Keyboard shortcuts
- Dark theme
- Good editor dimensions
- Preserve cursor position where practical
- Autosave code to SQLite

Autosave should happen after a short debounce, e.g. 500–1000ms.

---

# 31. UI Theme

Default to a dark, professional coding-assessment interface.

Characteristics:

- Minimal
- Dense but readable
- Neutral colors
- Clear hierarchy
- No unnecessary cards
- No decorative illustrations
- No marketing sections
- No animations unless useful
- Excellent editor experience

Use a layout inspired by professional coding assessment platforms.

Do not copy CodeSignal's exact visual design.

---

# 32. Main Screens

Only build the screens that are necessary.

## Screen 1 — Assessment List

Shows available assessments.

Information:

- Name
- Duration
- Number of levels
- Language
- Progress

Actions:

```text
Start
Continue
```

## Screen 2 — Assessment Workspace

Contains:

- Problem description
- Level navigation
- Code editor
- Public test results
- Hidden test result summary
- Run Tests
- Submit
- Timer when assessment mode is active

## Screen 3 — Completion State

When all levels pass:

```text
Assessment Complete

Working Hours Register

4 / 4 levels passed

[Review Assessment]
```

No unnecessary analytics dashboard.

---

# 33. Assessment List Example

```text
Industry Coding Assessments

┌────────────────────────────────────────────────────────┐
│ Working Hours Register                                 │
│                                                        │
│ 90 min · 4 levels · JavaScript                         │
│ Employee working-hours and compensation system         │
│                                                        │
│ Progress: 2 / 4                                       │
│                                                        │
│                                  [Continue]             │
└────────────────────────────────────────────────────────┘
```

---

# 34. API Routes

Keep the backend simple.

Possible routes:

```text
GET    /api/assessments
GET    /api/assessments/:id
GET    /api/assessments/:id/levels/:level

GET    /api/assessments/:id/code/:level
PUT    /api/assessments/:id/code/:level

POST   /api/assessments/:id/run
POST   /api/assessments/:id/submit

GET    /api/assessments/:id/progress
```

Do not create unnecessary APIs.

---

# 35. Internal Architecture

Recommended structure:

```text
src/
├── app/
│   ├── page.tsx
│   ├── assessments/
│   │   └── [assessmentId]/
│   │       └── page.tsx
│   └── api/
│       ├── assessments/
│       └── execution/
│
├── components/
│   ├── assessment/
│   │   ├── AssessmentList.tsx
│   │   ├── AssessmentWorkspace.tsx
│   │   ├── LevelNavigation.tsx
│   │   ├── ProblemDescription.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── TestResults.tsx
│   │   └── AssessmentTimer.tsx
│   │
│   └── ui/
│
├── lib/
│   ├── assessments/
│   ├── database/
│   ├── execution/
│   └── validation/
│
└── ...
```

The exact structure may differ if the coding agent has a better Next.js architecture.

Do not over-engineer.

---

# 36. Database Initialization

On first application startup:

1. Create SQLite database if missing.
2. Run migrations.
3. Discover assessment packages.
4. Import/update assessment metadata.
5. Preserve existing candidate code and attempts.

Adding a new assessment should not require manually editing the database.

For example:

```text
Add:

assessments/airbnb-booking-system/

Restart app.

→ Assessment automatically appears.
```

---

# 37. Assessment Synchronization

The filesystem is the source of truth for:

- Problem descriptions
- Starter code
- Tests
- Solutions
- Assessment metadata

SQLite is the source of truth for:

- Candidate code
- Progress
- Attempts
- Execution results
- Timer state

When assessment files change:

- Update assessment metadata.
- Do not overwrite candidate code automatically.
- Do not delete previous attempts unnecessarily.

---

# 38. Error Handling

The UI must distinguish between:

### Compilation/runtime error

```text
Runtime Error

ReferenceError: foo is not defined
```

### Test failure

```text
Test failed

Expected: 10
Received: 8
```

### Timeout

```text
Execution timed out after 5 seconds.
```

### Infrastructure failure

```text
Unable to execute tests.

Please check the local application logs.
```

Never expose internal server stack traces to the candidate UI.

---

# 39. Performance

This is a local application, so optimize for simplicity.

Expected workload:

```text
1 user
1 assessment at a time
1 test execution at a time
```

Do not build distributed execution infrastructure.

The UI should feel responsive.

Target:

- Assessment page load: fast
- Public test execution: near-instant for normal problems
- Autosave: < 1 second
- Submit feedback: immediate after tests finish

---

# 40. Keyboard Shortcuts

Support useful coding-assessment shortcuts.

At minimum:

```text
Cmd/Ctrl + S
```

Save code.

Optionally:

```text
Cmd/Ctrl + Enter
```

Run tests.

Avoid introducing many custom shortcuts.

---

# 41. Local Data

Store application data under a predictable local directory.

Example:

```text
.data/
└── assessment.db
```

Do not store user data in browser localStorage as the primary persistence mechanism.

SQLite is the source of truth.

---

# 42. No Login

There is exactly one local user.

Do not build:

- Authentication
- Sessions
- User accounts
- Passwords
- OAuth
- Profiles

When the application starts, the user immediately has access to all assessments.

---

# 43. No Internet Dependency

After dependencies are installed, the platform should not require an internet connection.

Do not call external APIs.

Do not send:

- Candidate code
- Test results
- Assessment data
- Usage information

to external services.

---

# 44. Developer Experience

The repository should include:

```text
README.md
SPEC.md
package.json
.env.example (only if actually needed)
```

README must explain:

```bash
npm install
npm run dev
```

and how to add an assessment.

---

# 45. Adding a New Assessment

The final developer workflow should be extremely simple.

Example:

```text
assessments/
└── working-hours-register/
```

The AI coding agent creates:

```text
metadata.json
levels/level-1/*
levels/level-2/*
levels/level-3/*
levels/level-4/*
```

Restart the application.

The assessment appears automatically.

No database editing.

No frontend code changes.

No backend code changes.

---

# 46. Assessment Authoring Rules

The AI coding agent creating an assessment must follow these rules:

1. Every public API must be explicitly documented.
2. Every level must have clear acceptance criteria.
3. Every level must have public tests.
4. Every level must have hidden tests.
5. Every level must have a reference solution.
6. Reference solution must pass every test.
7. Tests must be deterministic.
8. Tests must not depend on current time.
9. Tests must not depend on network access.
10. Tests must not depend on filesystem state outside the test workspace.
11. Hidden tests must not be visible through the UI.
12. Earlier-level functionality must remain tested in later levels.
13. Edge cases must be explicitly covered.
14. Test cases must reflect the actual problem specification.
15. Avoid ambiguous behavior. Define it in the problem description.

---

# 47. Test Isolation

Every test execution must start from a clean execution environment.

Do not allow state from:

```text
previous Run
```

to leak into:

```text
next Run
```

However, candidate code itself must persist.

Therefore:

```text
Candidate code
      ↓
fresh execution environment
      ↓
fresh instance of candidate API
      ↓
tests
      ↓
destroy environment
```

---

# 48. Testing the Platform

The coding agent must create platform-level tests for:

## Assessment loading

- Load valid assessment
- Load multiple assessments
- Invalid assessment metadata
- Missing files

## Code persistence

- Save code
- Reload code
- Update code
- Preserve code across restart

## Test execution

- Passing code
- Failing code
- Runtime error
- Infinite loop
- Timeout
- Multiple tests

## Progress

- Level passed
- Level failed
- Multiple levels
- Assessment completed

## Database

- Fresh database
- Migration
- Restart persistence

---

# 49. Example Assessment Package

For the Working Hours Register assessment, the generated package should look approximately like:

```text
assessments/
└── working-hours-register/
    ├── metadata.json
    ├── README.md
    │
    └── levels/
        ├── level-1/
        │   ├── description.md
        │   ├── starter.js
        │   ├── tests.public.js
        │   ├── tests.hidden.js
        │   └── solution.js
        │
        ├── level-2/
        │   ├── description.md
        │   ├── starter.js
        │   ├── tests.public.js
        │   ├── tests.hidden.js
        │   └── solution.js
        │
        ├── level-3/
        │   ├── description.md
        │   ├── starter.js
        │   ├── tests.public.js
        │   ├── tests.hidden.js
        │   └── solution.js
        │
        └── level-4/
            ├── description.md
            ├── starter.js
            ├── tests.public.js
            ├── tests.hidden.js
            └── solution.js
```

---

# 50. Important Assessment Semantics

Do not invent requirements that are not present in an assessment specification.

If an assessment says:

> Promotion becomes active on the employee's next successful office entry.

The generated problem must clearly define:

- What constitutes a successful entry.
- What happens if the employee is already inside.
- What happens if multiple promotions are requested.
- Which promotion applies.
- Whether failed/invalid operations exist.
- What happens at exact timestamps.
- How salary intervals are treated.

The coding agent must resolve ambiguities **before generating tests**.

If the original assessment source leaves something genuinely ambiguous, choose a reasonable deterministic behavior and document it explicitly.

---

# 51. Code Quality

The platform itself should be production-quality enough for personal daily use.

Use:

- TypeScript
- Strict type checking
- Clear module boundaries
- Small components
- Good error handling
- Automated tests
- No unnecessary abstractions

Avoid:

- Over-engineering
- Microservices
- Event buses
- Redis
- Docker unless required
- Kubernetes
- GraphQL
- WebSockets unless actually needed
- Complex state-management libraries unless necessary

---

# 52. Definition of Done

The implementation is complete only when all of the following work:

### Application

- [ ] `npm install` works.
- [ ] `npm run dev` starts the application.
- [ ] Application opens at localhost.
- [ ] No login is required.

### Assessment discovery

- [ ] Assessments are loaded from the filesystem.
- [ ] Multiple assessments are supported.
- [ ] Multiple levels are supported.

### Workspace

- [ ] Problem description is visible.
- [ ] Level navigation works.
- [ ] Monaco editor works.
- [ ] JavaScript code executes.
- [ ] Code autosaves.
- [ ] Code persists after restart.

### Tests

- [ ] Public tests work.
- [ ] Hidden tests work.
- [ ] Run Tests works.
- [ ] Submit works.
- [ ] Runtime errors are displayed.
- [ ] Timeouts work.
- [ ] Hidden test implementation/details are not exposed.

### Progress

- [ ] Level progress persists.
- [ ] Passed levels are displayed.
- [ ] Failed levels remain available.
- [ ] All levels can be revisited.
- [ ] Assessment completion is detected.

### Timer

- [ ] Practice mode works without a timer.
- [ ] Assessment mode supports the configured duration.
- [ ] Timer persists across refreshes.

### SQLite

- [ ] Database is created automatically.
- [ ] Migrations work.
- [ ] Candidate code persists.
- [ ] Attempts persist.
- [ ] Progress persists.

### Assessment authoring

- [ ] A new assessment can be added by creating its assessment directory.
- [ ] No application source-code changes are required.
- [ ] No manual database editing is required.

---

# 53. Implementation Priority

Build in this order:

## Phase 1 — Foundation

- Next.js application
- SQLite
- Assessment filesystem loader
- Basic assessment list

## Phase 2 — Coding workspace

- Assessment workspace
- Problem description
- Level navigation
- Monaco editor
- Code persistence

## Phase 3 — Execution

- Child-process execution
- Public tests
- Hidden tests
- Test result UI
- Run Tests
- Submit

## Phase 4 — Progress

- Level state
- Attempts
- Assessment completion
- Resume behavior

## Phase 5 — Timer

- Practice mode
- Assessment mode
- Persistent timer

## Phase 6 — Polish

- CodeSignal-inspired professional UI
- Keyboard shortcuts
- Error handling
- Loading states
- Empty states
- Responsive layout

Do not build future features outside this specification.

---

# 54. Final Product Philosophy

This application should feel like:

> "I downloaded a coding assessment, opened localhost, and I'm taking the interview."

It should NOT feel like:

> "I am using a project management platform with a coding feature."

The product should be:

- Fast
- Minimal
- Professional
- Local
- Persistent
- Assessment-focused
- Easy to extend
- Easy for an AI coding agent to populate with new questions

The **assessment content should be completely separated from the platform implementation**.

The platform is the reusable engine.

The assessment directory is the content.

That separation is the most important architectural requirement in the project.
