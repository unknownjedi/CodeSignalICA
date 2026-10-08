const FileStore = require("./solution");

module.exports = [
  {
    id: "fs-l4-h1",
    name: "decompress uncompressed ignored",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.decompressFile('a'); t.eq(s.getFile('a'), 10);
    },
  },
  {
    id: "fs-l4-h2",
    name: "decompress blocked by capacity",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.addUser('u1', 10); s.assignOwner('a', 'u1'); s.compressFile('a'); s.addFile('b', 5); s.assignOwner('b', 'u1'); s.decompressFile('a'); t.eq(s.isCompressed('a'), true); t.eq(s.getUsage('u1'), 10);
    },
  },
  {
    id: "fs-l4-h3",
    name: "odd sizes floor",
    run(t) {
      const s = new FileStore(); s.addFile('a', 7); s.compressFile('a'); t.eq(s.getFile('a'), 3);
    },
  },
  {
    id: "fs-l4-h4",
    name: "copy copies current size",
    run(t) {
      const s = new FileStore(); s.addFile('a', 10); s.compressFile('a'); s.copyFile('a', 'b'); t.eq(s.getFile('b'), 5); t.eq(s.isCompressed('b'), false);
    },
  },
  {
    id: "fs-l4-h5",
    name: "zero and one compress safely",
    run(t) {
      const s = new FileStore(); s.addFile('z', 0); s.addFile('o', 1); s.compressFile('z'); s.compressFile('o'); t.eq(s.getFile('z'), 0); t.eq(s.getFile('o'), 0); s.decompressFile('o'); t.eq(s.getFile('o'), 1);
    },
  },
  {
    id: "fs-l4-h6",
    name: "isCompressed unknown false",
    run(t) {
      const s = new FileStore(); t.eq(s.isCompressed('x'), false);
    },
  },
  {
    id: "fs-l4-h7",
    name: "regression: find ordering after compress",
    run(t) {
      const s = new FileStore(); s.addFile('a', 100); s.addFile('b', 5); s.compressFile('a'); t.eq(s.findByPrefix(''), ['a', 'b']);
    },
  },
];
