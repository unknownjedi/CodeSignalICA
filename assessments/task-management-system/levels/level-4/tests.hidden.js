const TaskManager = require("./solution");

module.exports = [
  {
    id: "tm-l4-h1",
    name: "complete twice ignored",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.completeTask('u1', 't1', 1); m.completeTask('u1', 't1', 2); t.eq(m.getOverdueAssignments(20), []);
    },
  },
  {
    id: "tm-l4-h2",
    name: "reassign after completion",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.completeTask('u1', 't1', 1); m.assignTask('u1', 't1', 2, 10); t.eq(m.getAssignments('u1', 3), ['t1']);
    },
  },
  {
    id: "tm-l4-h3",
    name: "overdue excludes completed",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); m.completeTask('u1', 't1', 5); t.eq(m.getOverdueAssignments(100), []);
    },
  },
  {
    id: "tm-l4-h4",
    name: "overdue sorted",
    run(t) {
      const m = new TaskManager(); m.addTask('t3', 'T3', 1); m.addTask('t1', 'T1', 1); m.addUser('u1', 5); m.assignTask('u1', 't3', 0, 5); m.assignTask('u1', 't1', 0, 5); t.eq(m.getOverdueAssignments(5), ['t1', 't3']);
    },
  },
  {
    id: "tm-l4-h5",
    name: "complete unknown ignored",
    run(t) {
      const m = new TaskManager(); m.completeTask('u1', 't1', 0); t.eq(m.getOverdueAssignments(0), []);
    },
  },
  {
    id: "tm-l4-h6",
    name: "active assignment not overdue",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 10); t.eq(m.getOverdueAssignments(9), []);
    },
  },
  {
    id: "tm-l4-h7",
    name: "regression: list ordering",
    run(t) {
      const m = new TaskManager(); m.addTask('a', 'A', 1); m.addTask('b', 'B', 2); t.eq(m.listTasks(), ['b', 'a']);
    },
  },
  {
    id: "tm-l4-h8",
    name: "quota frees after completion",
    run(t) {
      const m = new TaskManager(); m.addTask('t1', 'T1', 1); m.addTask('t2', 'T2', 1); m.addUser('u1', 1); m.assignTask('u1', 't1', 0, 100); m.completeTask('u1', 't1', 1); m.assignTask('u1', 't2', 2, 100); t.eq(m.getAssignments('u1', 3), ['t2']);
    },
  },
];
