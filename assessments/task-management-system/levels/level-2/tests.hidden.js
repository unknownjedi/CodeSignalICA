const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l2-h1",
    name: "search no match",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'Alpha', 1); t.eq(m.searchTasks('zzz'), []);
    },
  },
  {
    id: "tm-l2-h2",
    name: "search uses substring",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'Deploy service', 2); m.addTask('b', 'plo', 5); t.eq(m.searchTasks('plo'), ['b', 'a']);
    },
  },
  {
    id: "tm-l2-h3",
    name: "list uses all tasks",
    run(t) {
      const m = new TaskManager(); t.eq(m.listTasks(), []); m.addTask('a', 'A', 1); t.eq(m.listTasks(), ['a']);
    },
  },
  {
    id: "tm-l2-h4",
    name: "regression: get and update",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'A', 1); m.updateTask('a', { name: 'B' }); t.eq(m.getTask('a'), { id: 'a', name: 'B', priority: 1 });
    },
  },
  {
    id: "tm-l2-h5",
    name: "equal priorities sort by id",
    run(t) {
      const m = new TaskManager(); m.addTask('c', 'C', 1); m.addTask('a', 'A', 1); m.addTask('b', 'B', 1); t.eq(m.listTasks(), ['a', 'b', 'c']);
    },
  },
  {
    id: "tm-l2-h6",
    name: "case insensitive both ways",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'HELLO', 1); t.eq(m.searchTasks('hello'), ['a']); t.eq(m.searchTasks('HELLO'), ['a']);
    },
  },
];
