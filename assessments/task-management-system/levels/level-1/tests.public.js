const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l1-p1",
    name: "add and get",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'Write', 3); t.eq(m.getTask('a'), { id: 'a', name: 'Write', priority: 3 });
    },
  },
  {
    id: "tm-l1-p2",
    name: "duplicate add ignored",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'One', 1); m.addTask('a', 'Two', 2); t.eq(m.getTask('a'), { id: 'a', name: 'One', priority: 1 });
    },
  },
  {
    id: "tm-l1-p3",
    name: "update changes fields",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'One', 1); m.updateTask('a', { name: 'Two', priority: 5 }); t.eq(m.getTask('a'), { id: 'a', name: 'Two', priority: 5 });
    },
  },
  {
    id: "tm-l1-p4",
    name: "unknown returns null",
    run(t) {
      const m = new TaskManager(); t.eq(m.getTask('x'), null);
    },
  },
];
