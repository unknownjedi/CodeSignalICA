const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l3-h1",
    name: "duplicate user ignored",
    run(t) {
      const m = new TaskManager(); m.addUser('u1', 1); m.addUser('u1', 5); m.addTask('t1', 'T1', 1); m.addTask('t2', 'T2', 1); m.assignTask('u1', 't1', 0, 10); m.assignTask('u1', 't2', 1, 10); t.eq(m.getAssignments('u1', 5), ['t1']);
    },
  },
  {
    id: "tm-l3-h2",
    name: "expiry boundary is exclusive",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); t.eq(m.getAssignments('u1', 9), ['t1']); t.eq(m.getAssignments('u1', 10), []);
    },
  },
  {
    id: "tm-l3-h3",
    name: "cannot reassign active task",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.addUser('u2', 1); m.assignTask('u1', 't1', 0, 10); m.assignTask('u2', 't1', 1, 10); t.eq(m.getAssignments('u2', 5), []);
    },
  },
  {
    id: "tm-l3-h4",
    name: "reassign after expiry",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.assignTask('u1', 't1', 20, 10); t.eq(m.getAssignments('u1', 25), ['t1']);
    },
  },
  {
    id: "tm-l3-h5",
    name: "quota counts active only",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addTask('t2', 'T2', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.assignTask('u1', 't2', 10, 10); t.eq(m.getAssignments('u1', 15), ['t2']);
    },
  },
  {
    id: "tm-l3-h6",
    name: "negative ttl immediately overdue",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 5, -1); t.eq(m.getAssignments('u1', 5), []);
    },
  },
  {
    id: "tm-l3-h7",
    name: "regression: search ordering",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'run tests', 1); m.addTask('b', 'run build', 3); t.eq(m.searchTasks('run'), ['b', 'a']);
    },
  },
];
