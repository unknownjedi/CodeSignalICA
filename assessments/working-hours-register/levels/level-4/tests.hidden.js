const WorkingHours = require("./src/working-hours");

function promotedEmployee(system, id, rate, sessions) {
  system.addEmployee(id, "Engineer");
  system.promote(id, "Senior", rate);
  for (const [enter, exit] of sessions) {
    system.record(id, enter, "enter");
    system.record(id, exit, "exit");
  }
}

module.exports = [
  {
    id: "l4-hidden-unknown-employee",
    name: "Unknown employees have no additional compensation",
    run(t) {
      const system = new WorkingHours();
      system.addDoublePayPeriod(0, 100);
      t.eq(system.getAdditionalCompensation("ghost", 0, 100), 0);
    },
  },
  {
    id: "l4-hidden-empty-window",
    name: "An empty or inverted window returns zero",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(0, 100);
      t.eq(system.getAdditionalCompensation("john", 50, 50), 0);
      t.eq(system.getAdditionalCompensation("john", 80, 20), 0);
    },
  },
  {
    id: "l4-hidden-inverted-period-ignored",
    name: "A period with end < start is ignored",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(80, 20);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
    },
  },
  {
    id: "l4-hidden-zero-length-period",
    name: "A zero-length period has no effect",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(50, 50);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
    },
  },
  {
    id: "l4-hidden-touching-boundary",
    name: "Touching a boundary contributes nothing extra",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(100, 200);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
      system.addDoublePayPeriod(0, 0);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
    },
  },
  {
    id: "l4-hidden-adjacent-periods",
    name: "Adjacent periods are counted once without gaps",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(0, 50);
      system.addDoublePayPeriod(50, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 1000);
    },
  },
  {
    id: "l4-hidden-nested-periods",
    name: "Nested periods are merged",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(0, 100);
      system.addDoublePayPeriod(20, 40);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 1000);
    },
  },
  {
    id: "l4-hidden-period-outside-session",
    name: "Periods outside the session contribute nothing",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(200, 300);
      t.eq(system.getAdditionalCompensation("john", 0, 1000), 0);
    },
  },
  {
    id: "l4-hidden-window-inside-period",
    name: "A window inside a period only pays the window",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(0, 1000);
      t.eq(system.getAdditionalCompensation("john", 25, 75), 500);
    },
  },
  {
    id: "l4-hidden-window-outside-period",
    name: "A window outside the period returns zero",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100], [200, 300]]);
      system.addDoublePayPeriod(100, 200);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
      t.eq(system.getAdditionalCompensation("john", 200, 300), 0);
    },
  },
  {
    id: "l4-hidden-incomplete-session",
    name: "Incomplete sessions earn no additional compensation",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.addDoublePayPeriod(0, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 1000), 0);
    },
  },
  {
    id: "l4-hidden-multiple-sessions-and-rates",
    name: "Multiple sessions with different rates use each session's rate",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.promote("john", "Staff", 20);
      system.record("john", 200, "enter");
      system.record("john", 300, "exit");
      system.addDoublePayPeriod(0, 1000);
      t.eq(system.getAdditionalCompensation("john", 0, 1000), 1000 + 2000);
      t.eq(system.calculateSalary("john", 0, 1000), 1000 + 2000);
    },
  },
  {
    id: "l4-hidden-period-added-after-sessions",
    name: "Periods added later still apply to completed sessions",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
      system.addDoublePayPeriod(0, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 1000);
    },
  },
  {
    id: "l4-hidden-regression-calculate-salary",
    name: "Regression: calculateSalary is unaffected by periods",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(0, 100);
      t.eq(system.calculateSalary("john", 0, 100), 1000);
      t.eq(system.calculateSalary("john", 25, 75), 500);
    },
  },
  {
    id: "l4-hidden-regression-level-1-and-2",
    name: "Regression: working time and ranking still hold",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 50]]);
      promotedEmployee(system, "mary", 10, [[0, 80]]);
      system.addDoublePayPeriod(0, 1000);
      t.eq(system.getWorkingTime("john"), 50);
      t.eq(system.getWorkingTime("mary"), 80);
      t.eq(system.topNEmployees(2, "Senior"), ["mary", "john"]);
    },
  },
  {
    id: "l4-hidden-regression-promotions",
    name: "Regression: promotion activation still works",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.promote("john", "Staff", 20);
      system.record("john", 200, "enter");
      system.record("john", 300, "exit");
      system.addDoublePayPeriod(0, 1000);
      t.eq(system.getAdditionalCompensation("john", 0, 300), 1000 + 2000);
      t.eq(system.calculateSalary("john", 0, 300), 3000);
    },
  },
  {
    id: "l4-hidden-union-window-and-periods",
    name: "Union of overlapping periods and window intersection",
    run(t) {
      const system = new WorkingHours();
      promotedEmployee(system, "john", 10, [[0, 100]]);
      system.addDoublePayPeriod(0, 30);
      system.addDoublePayPeriod(20, 60);
      system.addDoublePayPeriod(90, 120);
      // Union inside session: [0, 60] and [90, 100] = 70 minutes.
      t.eq(system.getAdditionalCompensation("john", 0, 100), 700);
      // Window [25, 95] intersects union at [25, 60] and [90, 95] = 40 minutes.
      t.eq(system.getAdditionalCompensation("john", 25, 95), 400);
    },
  },
  {
    id: "l4-hidden-zero-salary-session",
    name: "Sessions with zero salary earn no compensation",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.addDoublePayPeriod(0, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
    },
  },
];
