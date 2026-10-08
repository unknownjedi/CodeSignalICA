const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l3-h1",
    name: "getAt picks latest at or before",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0); m.put('a', 2, 10); m.put('a', 3, 20); t.eq(m.getAt('a', 15), 2);
    },
  },
  {
    id: "om-l3-h2",
    name: "history order",
    run(t) {
      const m = new ObjectManager(); m.put('a', 2, 10); m.put('a', 1, 0); t.eq(m.history('a').map(function (v) { return v.timestamp; }), [0, 10]);
    },
  },
  {
    id: "om-l3-h3",
    name: "getAt expired latest falls back to null",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0); m.put('a', 2, 10, 5); t.eq(m.getAt('a', 12), 2); t.eq(m.getAt('a', 16), null);
    },
  },
  {
    id: "om-l3-h4",
    name: "get still returns latest",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0); m.put('a', 2, 10); t.eq(m.get('a'), 2);
    },
  },
  {
    id: "om-l3-h5",
    name: "history empty for missing",
    run(t) {
      const m = new ObjectManager(); t.eq(m.history('x'), []);
    },
  },
  {
    id: "om-l3-h6",
    name: "regression: ttl get",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 10); t.eq(m.get('a', 5), 1); t.eq(m.get('a', 10), null);
    },
  },
];
