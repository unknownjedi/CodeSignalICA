const WorkingHours = require("./src/working-hours");

module.exports = [
  {
    id: "l3-hidden-unknown-employee",
    name: "Unknown employees earn no salary",
    run(t) {
      const system = new WorkingHours();
      t.eq(system.calculateSalary("ghost", 0, 100), 0);
      system.promote("ghost", "Senior", 50);
      t.eq(system.calculateSalary("ghost", 0, 100), 0);
    },
  },
  {
    id: "l3-hidden-promote-does-not-throw",
    name: "Promoting an unknown employee is ignored",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("nobody", "Senior", 10);
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 10, "exit");
      t.eq(system.calculateSalary("john", 0, 10), 100);
    },
  },
  {
    id: "l3-hidden-incomplete-session-not-paid",
    name: "Incomplete sessions are not paid",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 50, "exit");
      system.record("john", 60, "enter");
      t.eq(system.calculateSalary("john", 0, 1000), 500);
    },
  },
  {
    id: "l3-hidden-pending-never-activates",
    name: "A pending promotion without an entry never activates",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      t.eq(system.topNEmployees(5, "Engineer"), ["john"]);
      t.eq(system.topNEmployees(5, "Senior"), []);
    },
  },
  {
    id: "l3-hidden-activation-not-before-entry",
    name: "Salary is not retroactive before the activating entry",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 100, "enter");
      system.record("john", 200, "exit");
      t.eq(system.calculateSalary("john", 0, 100), 0);
      t.eq(system.calculateSalary("john", 100, 200), 1000);
      t.eq(system.calculateSalary("john", 150, 250), 500);
    },
  },
  {
    id: "l3-hidden-zero-length-session",
    name: "A zero-length paid session contributes zero",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 50, "enter");
      system.record("john", 50, "exit");
      t.eq(system.calculateSalary("john", 0, 100), 0);
    },
  },
  {
    id: "l3-hidden-negative-session-not-paid",
    name: "A session whose exit precedes its enter is not paid",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 100, "enter");
      system.record("john", 40, "exit");
      t.eq(system.calculateSalary("john", 0, 200), 0);
    },
  },
  {
    id: "l3-hidden-multiple-rates-window",
    name: "Windows spanning several rates use each session's rate",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.promote("john", "Staff", 20);
      system.record("john", 100, "enter");
      system.record("john", 200, "exit");
      system.promote("john", "Principal", 30);
      system.record("john", 200, "enter");
      system.record("john", 300, "exit");
      t.eq(system.calculateSalary("john", 0, 300), 6000);
      t.eq(system.calculateSalary("john", 50, 250), 500 + 2000 + 1500);
    },
  },
  {
    id: "l3-hidden-window-covers-full-sessions",
    name: "A window covering everything returns the full salary",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.record("john", 200, "enter");
      system.record("john", 250, "exit");
      t.eq(system.calculateSalary("john", -1000, 1000), 1500);
    },
  },
  {
    id: "l3-hidden-regression-working-time",
    name: "Regression: getWorkingTime is unchanged",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 100, "enter");
      system.record("john", 50, "exit");
      system.record("john", 60, "enter");
      system.record("john", 90, "exit");
      t.eq(system.getWorkingTime("john"), 30);
      t.eq(system.getWorkingTime("ghost"), 0);
    },
  },
  {
    id: "l3-hidden-topn-uses-current-position",
    name: "topNEmployees uses the current position after activation",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.addEmployee("mary", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.record("mary", 0, "enter");
      system.record("mary", 10, "exit");
      t.eq(system.topNEmployees(5, "Engineer"), ["mary"]);
      t.eq(system.topNEmployees(5, "Senior"), ["john"]);
    },
  },
  {
    id: "l3-hidden-pending-does-not-move-position",
    name: "A pending promotion does not move the employee",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      t.eq(system.topNEmployees(5, "Engineer"), ["john"]);
      t.eq(system.topNEmployees(5, "Senior"), []);
    },
  },
  {
    id: "l3-hidden-regression-topn-ties",
    name: "Regression: ranking and tie-breaking still hold",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("bob", "Engineer");
      system.addEmployee("alice", "Engineer");
      system.record("bob", 0, "enter");
      system.record("bob", 10, "exit");
      system.record("alice", 0, "enter");
      system.record("alice", 10, "exit");
      t.eq(system.topNEmployees(2, "Engineer"), ["alice", "bob"]);
      system.promote("bob", "Senior", 5);
      system.record("bob", 100, "enter");
      system.record("bob", 110, "exit");
      t.eq(system.topNEmployees(1, "Senior"), ["bob"]);
      t.eq(system.topNEmployees(5, "Engineer"), ["alice"]);
    },
  },
  {
    id: "l3-hidden-zero-salary-sessions",
    name: "Sessions before any promotion are worth zero",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      t.eq(system.calculateSalary("john", 0, 100), 0);
      system.promote("john", "Senior", 10);
      system.record("john", 200, "enter");
      system.record("john", 300, "exit");
      t.eq(system.calculateSalary("john", 0, 300), 1000);
    },
  },
  {
    id: "l3-hidden-promotion-chain",
    name: "A chain of promotions applies at each following entry",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "A", 1);
      system.record("john", 0, "enter");
      system.record("john", 10, "exit");
      system.promote("john", "B", 2);
      system.record("john", 10, "enter");
      system.record("john", 20, "exit");
      system.promote("john", "C", 3);
      system.record("john", 20, "enter");
      system.record("john", 30, "exit");
      t.eq(system.calculateSalary("john", 0, 30), 10 + 20 + 30);
      t.eq(system.topNEmployees(1, "C"), ["john"]);
    },
  },
  {
    id: "l3-hidden-promote-mid-session-not-retroactive",
    name: "A promotion mid-session never changes that session's rate",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.promote("john", "Staff", 20);
      system.record("john", 50, "exit");
      system.promote("john", "Principal", 30);
      system.record("john", 100, "enter");
      system.record("john", 110, "exit");
      t.eq(system.calculateSalary("john", 0, 110), 500 + 300);
    },
  },
];
