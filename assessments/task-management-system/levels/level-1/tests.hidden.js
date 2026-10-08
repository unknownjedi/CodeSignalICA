const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l1-h1",
    name: "update unknown ignored",
    run(t) {
      const m = new TaskManager(); m.updateTask('x', { name: 'N' }); t.eq(m.getTask('x'), null);
    },
  },
  {
    id: "tm-l1-h2",
    name: "partial update keeps other field",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'One', 1); m.updateTask('a', { priority: 9 }); t.eq(m.getTask('a'), { id: 'a', name: 'One', priority: 9 });
    },
  },
  {
    id: "tm-l1-h3",
    name: "get returns a copy",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'One', 1); const task = m.getTask('a'); task.name = 'Changed'; t.eq(m.getTask('a').name, 'One');
    },
  },
  {
    id: "tm-l1-h4",
    name: "update with no fields is a no-op",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'One', 1); m.updateTask('a', {}); t.eq(m.getTask('a'), { id: 'a', name: 'One', priority: 1 });
    },
  },
  {
    id: "tm-l1-h5",
    name: "zero and negative priorities",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'A', 0); m.addTask('b', 'B', -5); t.eq(m.getTask('a').priority, 0); t.eq(m.getTask('b').priority, -5);
    },
  },
  {
    id: "tm-l1-h6",
    name: "missing updates ignored",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'A', 1); m.updateTask('a'); t.eq(m.getTask('a').priority, 1);
    },
  },
];
