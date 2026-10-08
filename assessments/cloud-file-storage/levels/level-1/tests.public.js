const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l1-p1",
    name: "adds and reads a file",
    run(t) {
      const s = new FileStore(); s.addFile('a.txt', 10); t.eq(s.getFile('a.txt'), 10);
    },
  },
  {
    id: "fs-l1-p2",
    name: "duplicate add ignored",
    run(t) {
      const s = new FileStore(); s.addFile('a.txt', 10); s.addFile('a.txt', 99); t.eq(s.getFile('a.txt'), 10);
    },
  },
  {
    id: "fs-l1-p3",
    name: "copies a file",
    run(t) {
      const s = new FileStore(); s.addFile('a.txt', 10); s.copyFile('a.txt', 'b.txt'); t.eq(s.getFile('b.txt'), 10);
    },
  },
  {
    id: "fs-l1-p4",
    name: "copy overwrites destination",
    run(t) {
      const s = new FileStore(); s.addFile('a.txt', 10); s.addFile('b.txt', 3); s.copyFile('a.txt', 'b.txt'); t.eq(s.getFile('b.txt'), 10);
    },
  },
];
