const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l3-p1",
    name: "assigns owner and tracks usage",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addUser('u1', 20); s.assignOwner('a', 'u1'); t.eq(s.getOwner('a'), 'u1'); t.eq(s.getUsage('u1'), 10);
    },
  },
  {
    id: "fs-l3-p2",
    name: "capacity exceeded is ignored",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addFile('b', 15); s.addUser('u1', 20); s.assignOwner('a', 'u1'); s.assignOwner('b', 'u1'); t.eq(s.getOwner('b'), null); t.eq(s.getUsage('u1'), 10);
    },
  },
  {
    id: "fs-l3-p3",
    name: "moving ownership updates usages",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addUser('u1', 100); s.addUser('u2', 100); s.assignOwner('a', 'u1'); s.assignOwner('a', 'u2'); t.eq(s.getUsage('u1'), 0); t.eq(s.getUsage('u2'), 10); t.eq(s.getOwner('a'), 'u2');
    },
  },
  {
    id: "fs-l3-p4",
    name: "unknown owner is null",
    run(t) {
      const s = new FileStore(); t.eq(s.getOwner('x'), null);
    },
  },
];
