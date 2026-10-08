const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l2-p1",
    name: "finds by prefix",
    run(t) {
      const s = new FileStore(); s.addFile('report.txt', 10); s.addFile('readme.md', 5); s.addFile('data.csv', 2); t.eq(s.findByPrefix('re'), ['report.txt', 'readme.md']);
    },
  },
  {
    id: "fs-l2-p2",
    name: "finds by suffix",
    run(t) {
      const s = new FileStore(); s.addFile('a.txt', 10); s.addFile('b.md', 3); t.eq(s.findBySuffix('.txt'), ['a.txt']);
    },
  },
  {
    id: "fs-l2-p3",
    name: "orders by size then name",
    run(t) {
      const s = new FileStore(); s.addFile('a.txt', 5); s.addFile('b.txt', 9); s.addFile('c.txt', 9); t.eq(s.findBySuffix('.txt'), ['b.txt', 'c.txt', 'a.txt']);
    },
  },
  {
    id: "fs-l2-p4",
    name: "no matches",
    run(t) {
      const s = new FileStore(); t.eq(s.findByPrefix('zzz'), []);
    },
  },
];
