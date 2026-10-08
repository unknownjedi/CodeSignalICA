const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l3-h1",
    name: "duplicate user ignored",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addUser('u1', 20); s.addUser('u1', 5); s.assignOwner('a', 'u1'); t.eq(s.getUsage('u1'), 10);
    },
  },
  {
    id: "fs-l3-h2",
    name: "assign unknown ignored",
    run(t) {
      const s = new FileStore(); s.addUser('u1', 10); s.assignOwner('x', 'u1'); s.addFile('a', 1); s.assignOwner('a', 'u2'); t.eq(s.getOwner('a'), null);
    },
  },
  {
    id: "fs-l3-h3",
    name: "copy releases destination owner",
    run(t) {
      const s = new FileStore(); s.addFile('a', 5); s.addFile('b', 7); s.addUser('u1', 100); s.assignOwner('b', 'u1'); s.copyFile('a', 'b'); t.eq(s.getUsage('u1'), 0); t.eq(s.getOwner('b'), null);
    },
  },
  {
    id: "fs-l3-h4",
    name: "capacity exactly equal is allowed",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addUser('u1', 10); s.assignOwner('a', 'u1'); t.eq(s.getOwner('a'), 'u1');
    },
  },
  {
    id: "fs-l3-h5",
    name: "reassigning same owner is a no-op",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addUser('u1', 10); s.assignOwner('a', 'u1'); s.assignOwner('a', 'u1'); t.eq(s.getUsage('u1'), 10);
    },
  },
  {
    id: "fs-l3-h6",
    name: "usage of unknown user is 0",
    run(t) {
      const s = new FileStore(); t.eq(s.getUsage('nobody'), 0);
    },
  },
  {
    id: "fs-l3-h7",
    name: "regression: prefix ordering",
    run(t) {
      const s = new FileStore(); s.addFile('aa', 9); s.addFile('ab', 1); t.eq(s.findByPrefix('a'), ['aa', 'ab']);
    },
  },
];
