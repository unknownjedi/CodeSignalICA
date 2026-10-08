const WorkingHours = require("./src/working-hours");

module.exports = [
  {
    id: "l4-public-full-period",
    name: "A session fully inside a period earns double",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.addDoublePayPeriod(0, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 1000);
      t.eq(system.calculateSalary("john", 0, 100), 1000);
    },
  },
  {
    id: "l4-public-partial-period",
    name: "Only the covered part of a session earns double",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.addDoublePayPeriod(50, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 500);
    },
  },
  {
    id: "l4-public-overlapping-periods-counted-once",
    name: "Overlapping periods are merged",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.addDoublePayPeriod(0, 60);
      system.addDoublePayPeriod(40, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 100), 1000);
    },
  },
  {
    id: "l4-public-window-restricts-compensation",
    name: "The query window restricts compensation",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      system.addDoublePayPeriod(0, 100);
      t.eq(system.getAdditionalCompensation("john", 0, 50), 500);
      t.eq(system.getAdditionalCompensation("john", 25, 75), 500);
    },
  },
  {
    id: "l4-public-no-periods",
    name: "No periods means no additional compensation",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.promote("john", "Senior", 10);
      system.record("john", 0, "enter");
      system.record("john", 100, "exit");
      t.eq(system.getAdditionalCompensation("john", 0, 100), 0);
    },
  },
];
