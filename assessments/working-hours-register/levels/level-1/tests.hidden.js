const WorkingHours = require("./src/working-hours");

module.exports = [
  {
    id: "l1-hidden-unknown-employee-time",
    name: "Unknown employee has zero working time",
    run(t) {
      const system = new WorkingHours();
      t.eq(system.getWorkingTime("nobody"), 0);
    },
  },
  {
    id: "l1-hidden-duplicate-add",
    name: "Duplicate addEmployee keeps the original position and progress",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 30, "exit");
      system.addEmployee("john", "Manager");
      t.eq(system.getWorkingTime("john"), 20);
    },
  },
  {
    id: "l1-hidden-record-unknown-employee",
    name: "Recording events for an unknown employee is ignored",
    run(t) {
      const system = new WorkingHours();
      system.record("ghost", 10, "enter");
      system.record("ghost", 20, "exit");
      t.eq(system.getWorkingTime("ghost"), 0);
    },
  },
  {
    id: "l1-hidden-unknown-type",
    name: "Unknown event types are ignored",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 20, "pause");
      system.record("john", 30, "exit");
      t.eq(system.getWorkingTime("john"), 20);
    },
  },
  {
    id: "l1-hidden-duplicate-enter",
    name: "A second enter while inside is ignored",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 20, "enter");
      system.record("john", 30, "exit");
      t.eq(system.getWorkingTime("john"), 20);
    },
  },
  {
    id: "l1-hidden-exit-without-enter",
    name: "An exit while outside is ignored",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "exit");
      system.record("john", 20, "enter");
      system.record("john", 30, "exit");
      t.eq(system.getWorkingTime("john"), 10);
    },
  },
  {
    id: "l1-hidden-negative-session",
    name: "A session whose exit precedes its enter contributes zero",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 100, "enter");
      system.record("john", 50, "exit");
      t.eq(system.getWorkingTime("john"), 0);
      system.record("john", 60, "enter");
      system.record("john", 70, "exit");
      t.eq(system.getWorkingTime("john"), 10);
    },
  },
  {
    id: "l1-hidden-zero-length-session",
    name: "A zero-length session contributes zero",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 10, "exit");
      t.eq(system.getWorkingTime("john"), 0);
    },
  },
  {
    id: "l1-hidden-incomplete-not-counted",
    name: "Only completed sessions count",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 0, "enter");
      system.record("john", 10, "exit");
      system.record("john", 20, "enter");
      t.eq(system.getWorkingTime("john"), 10);
    },
  },
  {
    id: "l1-hidden-interleaved-employees",
    name: "Interleaved events across employees stay independent",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.addEmployee("mary", "Designer");
      system.record("john", 0, "enter");
      system.record("mary", 5, "enter");
      system.record("john", 10, "exit");
      system.record("mary", 25, "exit");
      system.record("mary", 30, "enter");
      system.record("john", 40, "enter");
      system.record("john", 50, "exit");
      system.record("mary", 60, "exit");
      t.eq(system.getWorkingTime("john"), 20);
      t.eq(system.getWorkingTime("mary"), 50);
    },
  },
  {
    id: "l1-hidden-state-after-invalid-events",
    name: "Invalid events do not corrupt state",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "exit");
      system.record("nobody", 10, "enter");
      system.record("john", 15, "enter");
      system.record("john", 20, "exit");
      system.record("john", 20, "exit");
      system.record("john", 25, "enter");
      system.record("john", 30, "exit");
      t.eq(system.getWorkingTime("john"), 10);
    },
  },
  {
    id: "l1-hidden-many-shifts",
    name: "Handles many shifts correctly",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      let timestamp = 0;
      for (let i = 0; i < 500; i += 1) {
        system.record("john", timestamp, "enter");
        timestamp += 3;
        system.record("john", timestamp, "exit");
        timestamp += 7;
      }
      t.eq(system.getWorkingTime("john"), 1500);
    },
  },
  {
    id: "l1-hidden-other-employee-unaffected",
    name: "One employee's incomplete shift does not affect another",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.addEmployee("mary", "Designer");
      system.record("john", 0, "enter");
      system.record("mary", 0, "enter");
      system.record("mary", 15, "exit");
      t.eq(system.getWorkingTime("john"), 0);
      t.eq(system.getWorkingTime("mary"), 15);
    },
  },
  {
    id: "l1-hidden-reenter-after-open-shift",
    name: "A completed shift after an open shift is still counted",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 10, "enter");
      system.record("john", 20, "exit");
      system.record("john", 30, "enter");
      system.record("john", 45, "exit");
      system.record("john", 60, "enter");
      t.eq(system.getWorkingTime("john"), 25);
    },
  },
];
