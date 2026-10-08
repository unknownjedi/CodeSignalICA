const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l2-h1",
    name: "prefix is case sensitive",
    run(t) {
      const s = new FileStore(); s.addFile('Report', 1); t.eq(s.findByPrefix('r'), []); t.eq(s.findByPrefix('R'), ['Report']);
    },
  },
  {
    id: "fs-l2-h2",
    name: "suffix is case sensitive",
    run(t) {
      const s = new FileStore(); s.addFile('a.TXT', 1); t.eq(s.findBySuffix('.txt'), []); t.eq(s.findBySuffix('.TXT'), ['a.TXT']);
    },
  },
  {
    id: "fs-l2-h3",
    name: "empty prefix matches all",
    run(t) {
      const s = new FileStore(); s.addFile('a', 1); s.addFile('b', 2); t.eq(s.findByPrefix(''), ['b', 'a']);
    },
  },
  {
    id: "fs-l2-h4",
    name: "empty suffix matches all",
    run(t) {
      const s = new FileStore(); s.addFile('a', 1); s.addFile('b', 2); t.eq(s.findBySuffix(''), ['b', 'a']);
    },
  },
  {
    id: "fs-l2-h5",
    name: "exact name via prefix",
    run(t) {
      const s = new FileStore(); s.addFile('abc', 1); t.eq(s.findByPrefix('abc'), ['abc']);
    },
  },
  {
    id: "fs-l2-h6",
    name: "regression: copy then find",
    run(t) {
      const s = new FileStore(); s.addFile('a.py', 2); s.copyFile('a.py', 'b.py'); t.eq(s.findBySuffix('.py'), ['a.py', 'b.py']);
    },
  },
];
