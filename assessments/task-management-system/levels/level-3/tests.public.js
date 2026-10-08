const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l3-p1",
    name: "assign and list active",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 2); m.assignTask('u1', 't1', 0, 10); t.eq(m.getAssignments('u1', 5), ['t1']);
    },
  },
  {
    id: "tm-l3-p2",
    name: "quota exceeded ignored",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addTask('t2', 'T2', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.assignTask('u1', 't2', 1, 10); t.eq(m.getAssignments('u1', 5), ['t1']);
    },
  },
  {
    id: "tm-l3-p3",
    name: "expired assignment not active",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); t.eq(m.getAssignments('u1', 10), []);
    },
  },
  {
    id: "tm-l3-p4",
    name: "unknown user or task ignored",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.assignTask('u1', 't1', 0, 10); m.addUser('u1', 1); m.assignTask('u1', 'nope', 0, 10); t.eq(m.getAssignments('u1', 0), []);
    },
  },
];
