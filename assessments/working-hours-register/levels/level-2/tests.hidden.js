const WorkingHours = require("./src/working-hours");

function seed(system, id, position, shifts) {
  system.addEmployee(id, position);
  for (const [enter, exit] of shifts) {
    system.record(id, enter, "enter");
    system.record(id, exit, "exit");
  }
}

module.exports = [
  {
    id: "l2-hidden-unknown-position",
    name: "Unknown position returns an empty array",
    run(t) {
      const system = new WorkingHours();
      seed(system, "john", "Engineer", [[0, 10]]);
      t.eq(system.topNEmployees(3, "Pilot"), []);
    },
  },
  {
    id: "l2-hidden-empty-register",
    name: "Empty register returns an empty array",
    run(t) {
      const system = new WorkingHours();
      t.eq(system.topNEmployees(5, "Engineer"), []);
    },
  },
  {
    id: "l2-hidden-zero-time-included",
    name: "Employees with zero completed time are still ranked",
    run(t) {
      const system = new WorkingHours();
      seed(system, "john", "Engineer", []);
      seed(system, "mary", "Engineer", []);
      t.eq(system.topNEmployees(5, "Engineer"), ["john", "mary"]);
    },
  },
  {
    id: "l2-hidden-zero-time-after-open-shift",
    name: "An open shift does not add ranking time",
    run(t) {
      const system = new WorkingHours();
      seed(system, "john", "Engineer", [[0, 50]]);
      seed(system, "mary", "Engineer", []);
      system.record("mary", 0, "enter");
      t.eq(system.topNEmployees(5, "Engineer"), ["john", "mary"]);
    },
  },
  {
    id: "l2-hidden-n-exact",
    name: "n equal to the number of matches returns everyone",
    run(t) {
      const system = new WorkingHours();
      seed(system, "a", "Engineer", [[0, 1]]);
      seed(system, "b", "Engineer", [[0, 2]]);
      seed(system, "c", "Engineer", [[0, 3]]);
      t.eq(system.topNEmployees(3, "Engineer"), ["c", "b", "a"]);
    },
  },
  {
    id: "l2-hidden-only-top-one",
    name: "n = 1 returns only the leader",
    run(t) {
      const system = new WorkingHours();
      seed(system, "a", "Engineer", [[0, 1]]);
      seed(system, "b", "Engineer", [[0, 9]]);
      t.eq(system.topNEmployees(1, "Engineer"), ["b"]);
    },
  },
  {
    id: "l2-hidden-multi-tie-break",
    name: "Multiple ties are ordered by id",
    run(t) {
      const system = new WorkingHours();
      seed(system, "carol", "Engineer", [[0, 10]]);
      seed(system, "alice", "Engineer", [[0, 10]]);
      seed(system, "bob", "Engineer", [[0, 10]]);
      seed(system, "dave", "Engineer", [[0, 5]]);
      t.eq(system.topNEmployees(4, "Engineer"), ["alice", "bob", "carol", "dave"]);
    },
  },
  {
    id: "l2-hidden-position-filtering-before-ranking",
    name: "Only employees of the requested position are considered",
    run(t) {
      const system = new WorkingHours();
      seed(system, "zoe", "Designer", [[0, 1000]]);
      seed(system, "john", "Engineer", [[0, 5]]);
      seed(system, "mary", "Engineer", [[0, 7]]);
      t.eq(system.topNEmployees(2, "Engineer"), ["mary", "john"]);
    },
  },
  {
    id: "l2-hidden-regression-working-time",
    name: "Regression: working time still follows Level 1 rules",
    run(t) {
      const system = new WorkingHours();
      system.addEmployee("john", "Engineer");
      system.record("john", 100, "enter");
      system.record("john", 50, "exit");
      system.record("john", 60, "enter");
      system.record("john", 70, "exit");
      system.record("john", 80, "enter");
      t.eq(system.getWorkingTime("john"), 10);
      t.eq(system.topNEmployees(1, "Engineer"), ["john"]);
    },
  },
  {
    id: "l2-hidden-repeated-calls-do-not-mutate",
    name: "Repeated calls return the same result",
    run(t) {
      const system = new WorkingHours();
      seed(system, "a", "Engineer", [[0, 4]]);
      seed(system, "b", "Engineer", [[0, 8]]);
      const first = system.topNEmployees(2, "Engineer");
      const second = system.topNEmployees(2, "Engineer");
      t.eq(first, ["b", "a"]);
      t.eq(second, ["b", "a"]);
      t.eq(system.getWorkingTime("a"), 4);
      t.eq(system.getWorkingTime("b"), 8);
    },
  },
  {
    id: "l2-hidden-many-employees",
    name: "Ranks a large register correctly",
    run(t) {
      const system = new WorkingHours();
      for (let i = 0; i < 200; i += 1) {
        const id = `emp-${String(i).padStart(3, "0")}`;
        system.addEmployee(id, "Engineer");
        system.record(id, 0, "enter");
        system.record(id, i, "exit");
      }
      const top = system.topNEmployees(3, "Engineer");
      t.eq(top, ["emp-199", "emp-198", "emp-197"]);
    },
  },
  {
    id: "l2-hidden-accumulated-shifts-ranking",
    name: "Ranking uses accumulated time across shifts",
    run(t) {
      const system = new WorkingHours();
      seed(system, "a", "Engineer", [[0, 10], [20, 25], [30, 35]]);
      seed(system, "b", "Engineer", [[0, 30]]);
      t.eq(system.topNEmployees(2, "Engineer"), ["b", "a"]);
    },
  },
  {
    id: "l2-hidden-ids-with-unusual-order",
    name: "Tie-breaking uses string order",
    run(t) {
      const system = new WorkingHours();
      seed(system, "Zoe", "Engineer", [[0, 10]]);
      seed(system, "adam", "Engineer", [[0, 10]]);
      t.eq(system.topNEmployees(2, "Engineer"), ["Zoe", "adam"]);
    },
  },
];
