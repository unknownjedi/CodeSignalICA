const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l4-h1",
    name: "duplicate snapshot overwrites",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.snapshot('s'); m.put('a', 2); m.snapshot('s'); m.put('a', 3); m.restore('s'); t.eq(m.get('a'), 2);
    },
  },
  {
    id: "om-l4-h2",
    name: "snapshot is independent copy",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.snapshot('s1'); m.put('a', 2); m.snapshot('s2'); m.restore('s1'); t.eq(m.get('a'), 1); m.restore('s2'); t.eq(m.get('a'), 2);
    },
  },
  {
    id: "om-l4-h3",
    name: "restore then history",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0); m.snapshot('s'); m.put('a', 2, 10); m.restore('s'); t.eq(m.getAt('a', 20), 1); t.eq(m.history('a').length, 1);
    },
  },
  {
    id: "om-l4-h4",
    name: "restore replaces deleted keys",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.snapshot('s'); m.delete('a'); m.restore('s'); t.eq(m.get('a'), 1);
    },
  },
  {
    id: "om-l4-h5",
    name: "regression: getAt after restore",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 100); m.snapshot('s'); m.put('a', 2, 50, 100); m.restore('s'); t.eq(m.getAt('a', 60), 1);
    },
  },
];
