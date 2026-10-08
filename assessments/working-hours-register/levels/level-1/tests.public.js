const WorkingHours = require("./src/working-hours");

module.exports = [
  {
    id: "l1-public-basic-employee",
    name: "Adds an employee with zero working time",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      t.eq(system.getWorkingTime("john"), 0);
    },
  },
  {
    id: "l1-public-single-shift",
    name: "Records a single completed shift",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 20, "exit");
      t.eq(system.getWorkingTime("john"), 10);
    },
  },
  {
    id: "l1-public-incomplete-shift",
    name: "Does not count an open shift",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 30, "enter");
      t.eq(system.getWorkingTime("john"), 0);
    },
  },
  {
    id: "l1-public-multiple-shifts",
    name: "Adds up multiple completed shifts",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 25, "exit");
      system.record("john", 40, "enter");
      system.record("john", 55, "exit");
      t.eq(system.getWorkingTime("john"), 30);
    },
  },
  {
    id: "l1-public-multiple-employees",
    name: "Tracks employees independently",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.addEmployee("mary", "Designer");
      system.record("john", 10, "enter");
      system.record("john", 30, "exit");
      system.record("mary", 0, "enter");
      system.record("mary", 5, "exit");
      t.eq(system.getWorkingTime("john"), 20);
      t.eq(system.getWorkingTime("mary"), 5);
    },
  },
];
