const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l4-p1",
    name: "snapshot and restore",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.snapshot('s1'); m.put('a', 2); m.restore('s1'); t.eq(m.get('a'), 1);
    },
  },
  {
    id: "om-l4-p2",
    name: "restore unknown ignored",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.restore('nope'); t.eq(m.get('a'), 1);
    },
  },
  {
    id: "om-l4-p3",
    name: "list snapshots sorted",
    run(t) {
      const m = new ObjectManager(); m.snapshot('b'); m.snapshot('a'); t.eq(m.listSnapshots(), ['a', 'b']);
    },
  },
  {
    id: "om-l4-p4",
    name: "empty snapshots list",
    run(t) {
      const m = new ObjectManager(); t.eq(m.listSnapshots(), []);
    },
  },
];
