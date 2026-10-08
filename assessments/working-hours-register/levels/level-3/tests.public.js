const WorkingHours = require("./src/working-hours");

module.exports = [
  {
    id: "l3-public-activates-on-entry",
    name: "A promotion activates on the next successful entry",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      t.eq(system.calculateSalary("john", 0, 1000), 0);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      t.eq(system.calculateSalary("john", 0, 1000), 1000);
    },
  },
  {
    id: "l3-public-historical-rates",
    name: "Historical salary uses the rate effective during each session",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.promote("john", "Staff", 20);
      system.record("john", 200, "enter");
      system.record("john", 300, "exit");
      t.eq(system.calculateSalary("john", 0, 300), 3000);
      t.eq(system.calculateSalary("john", 0, 250), 2000);
      t.eq(system.calculateSalary("john", 100, 200), 0);
    },
  },
  {
    id: "l3-public-promotion-while-inside",
    name: "A promotion while inside applies to the next entry",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.promote("john", "Staff", 20);
      system.record("john", 100, "exit");
      t.eq(system.calculateSalary("john", 0, 100), 1000);
      system.record("john", 100, "enter");
      system.record("john", 200, "exit");
      t.eq(system.calculateSalary("john", 100, 200), 2000);
      t.eq(system.calculateSalary("john", 0, 200), 3000);
    },
  },
  {
    id: "l3-public-latest-pending-wins",
    name: "The most recent pending promotion applies",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.promote("john", "Staff", 20);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      t.eq(system.calculateSalary("john", 0, 100), 2000);
      t.eq(system.topNEmployees(1, "Staff"), ["john"]);
      t.eq(system.topNEmployees(1, "Senior"), []);
    },
  },
  {
    id: "l3-public-window-boundaries",
    name: "Salary windows are inclusive with zero-width edges",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      t.eq(system.calculateSalary("john", 25, 75), 500);
      t.eq(system.calculateSalary("john", 100, 100), 0);
      t.eq(system.calculateSalary("john", 80, 20), 0);
      t.eq(system.calculateSalary("john", -10, 10), 100);
    },
  },
];
