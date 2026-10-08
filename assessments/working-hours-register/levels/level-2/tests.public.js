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
    id: "l2-public-ranking",
    name: "Ranks employees by completed working time",
    run(t) {
      const system = new WorkingHours();
      seed(system, "john", "Engineer", [[0, 30]]);
      seed(system, "mary", "Engineer", [[0, 10]]);
      seed(system, "zoe", "Engineer", [[0, 20]]);
      t.eq(system.topNEmployees(3, "Engineer"), ["john", "zoe", "mary"]);
    },
  },
  {
    id: "l2-public-filter-by-position",
    name: "Filters by position",
    run(t) {
      const system = new WorkingHours();
      seed(system, "john", "Engineer", [[0, 30]]);
      seed(system, "zoe", "Designer", [[0, 100]]);
      t.eq(system.topNEmployees(5, "Engineer"), ["john"]);
      t.eq(system.topNEmployees(5, "Designer"), ["zoe"]);
    },
  },
  {
    id: "l2-public-n-larger-than-matches",
    name: "Returns all matches when n is larger",
    run(t) {
      const system = new WorkingHours();
      seed(system, "john", "Engineer", [[0, 5]]);
      seed(system, "mary", "Engineer", [[0, 10]]);
      t.eq(system.topNEmployees(10, "Engineer"), ["mary", "john"]);
    },
  },
  {
    id: "l2-public-non-positive-n",
    name: "Returns an empty array for n <= 0",
    run(t) {
      const system = new WorkingHours();
      seed(system, "john", "Engineer", [[0, 5]]);
      t.eq(system.topNEmployees(0, "Engineer"), []);
      t.eq(system.topNEmployees(-2, "Engineer"), []);
    },
  },
  {
    id: "l2-public-tie-break",
    name: "Breaks ties by employee id ascending",
    run(t) {
      const system = new WorkingHours();
      seed(system, "bob", "Engineer", [[0, 10]]);
      seed(system, "alice", "Engineer", [[0, 10]]);
      t.eq(system.topNEmployees(2, "Engineer"), ["alice", "bob"]);
    },
  },
];
