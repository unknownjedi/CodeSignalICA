const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l2-p1",
    name: "list sorted by priority",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'A', 1); m.addTask('b', 'B', 3); m.addTask('c', 'C', 2); t.eq(m.listTasks(), ['b', 'c', 'a']);
    },
  },
  {
    id: "tm-l2-p2",
    name: "search case-insensitive",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'Write Report', 1); m.addTask('b', 'Read', 1); t.eq(m.searchTasks('write'), ['a']);
    },
  },
  {
    id: "tm-l2-p3",
    name: "tie broken by id",
    run(t) {
      const m = new TaskManager(); m.addTask('z', 'Z', 2); m.addTask('a', 'A', 2); t.eq(m.listTasks(), ['a', 'z']);
    },
  },
  {
    id: "tm-l2-p4",
    name: "empty query returns all",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'A', 1); m.addTask('b', 'B', 2); t.eq(m.searchTasks(''), ['b', 'a']);
    },
  },
];
