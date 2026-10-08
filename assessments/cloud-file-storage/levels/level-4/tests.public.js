const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l4-p1",
    name: "compress halves the size",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.compressFile('a'); t.eq(s.getFile('a'), 5); t.eq(s.isCompressed('a'), true);
    },
  },
  {
    id: "fs-l4-p2",
    name: "decompress restores the size",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.compressFile('a'); s.decompressFile('a'); t.eq(s.getFile('a'), 10); t.eq(s.isCompressed('a'), false);
    },
  },
  {
    id: "fs-l4-p3",
    name: "compressing twice is ignored",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.compressFile('a'); s.compressFile('a'); t.eq(s.getFile('a'), 5);
    },
  },
  {
    id: "fs-l4-p4",
    name: "usage updates on compress",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addUser('u1', 10); s.assignOwner('a', 'u1'); s.compressFile('a'); t.eq(s.getUsage('u1'), 5);
    },
  },
];
