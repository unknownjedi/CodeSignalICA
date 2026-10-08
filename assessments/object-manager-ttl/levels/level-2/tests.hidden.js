const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l2-h1",
    name: "expiry boundary is exclusive",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 10); t.eq(m.get('a', 9), 1); t.eq(m.get('a', 10), null);
    },
  },
  {
    id: "om-l2-h2",
    name: "update resets ttl",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 5); m.put('a', 2, 3, 100); t.eq(m.get('a', 10), 2);
    },
  },
  {
    id: "om-l2-h3",
    name: "keys sorted",
    run(t) {
      const m = new ObjectManager(); m.put('z', 1, 0); m.put('a', 2, 0); t.eq(m.keys(0), ['a', 'z']);
    },
  },
  {
    id: "om-l2-h4",
    name: "ttl zero expires immediately",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 0); t.eq(m.get('a', 0), null);
    },
  },
  {
    id: "om-l2-h5",
    name: "missing key with timestamp",
    run(t) {
      const m = new ObjectManager(); t.eq(m.get('x', 5), null);
    },
  },
  {
    id: "om-l2-h6",
    name: "regression: delete",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 100); m.delete('a'); t.eq(m.get('a', 0), null);
    },
  },
];
