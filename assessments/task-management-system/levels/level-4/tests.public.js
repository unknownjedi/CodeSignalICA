const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l4-p1",
    name: "complete active assignment",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.completeTask('u1', 't1', 3); t.eq(m.getAssignments('u1', 4), []);
    },
  },
  {
    id: "tm-l4-p2",
    name: "complete after expiry ignored",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.completeTask('u1', 't1', 10); t.eq(m.getOverdueAssignments(10), ['t1']);
    },
  },
  {
    id: "tm-l4-p3",
    name: "overdue report",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addTask('t2', 'T2', 1); m.addUser('u1', 2); m.assignTask('u1', 't1', 0, 10); m.assignTask('u1', 't2', 0, 5); t.eq(m.getOverdueAssignments(10), ['t1', 't2']);
    },
  },
  {
    id: "tm-l4-p4",
    name: "complete wrong user ignored",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.addUser('u2', 1); m.assignTask('u1', 't1', 0, 10); m.completeTask('u2', 't1', 3); t.eq(m.getAssignments('u1', 4), ['t1']);
    },
  },
];
