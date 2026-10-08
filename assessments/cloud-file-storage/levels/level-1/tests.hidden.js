const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l1-h1",
    name: "unknown file is null",
    run(t) {
      const s = new FileStore(); t.eq(s.getFile('x'), null);
    },
  },
  {
    id: "fs-l1-h2",
    name: "negative size ignored",
    run(t) {
      const s = new FileStore(); s.addFile('a', -1); t.eq(s.getFile('a'), null);
    },
  },
  {
    id: "fs-l1-h3",
    name: "copy from missing ignored",
    run(t) {
      const s = new FileStore(); s.copyFile('missing', 'b'); t.eq(s.getFile('b'), null);
    },
  },
  {
    id: "fs-l1-h4",
    name: "zero size allowed",
    run(t) {
      const s = new FileStore(); s.addFile('a', 0); t.eq(s.getFile('a'), 0);
    },
  },
  {
    id: "fs-l1-h5",
    name: "copy leaves source intact",
    run(t) {
      const s = new FileStore(); s.addFile('a', 7); s.copyFile('a', 'b'); t.eq(s.getFile('a'), 7);
    },
  },
  {
    id: "fs-l1-h6",
    name: "copy chain",
    run(t) {
      const s = new FileStore(); s.addFile('a', 4); s.copyFile('a', 'b'); s.copyFile('b', 'c'); t.eq(s.getFile('c'), 4);
    },
  },
];
