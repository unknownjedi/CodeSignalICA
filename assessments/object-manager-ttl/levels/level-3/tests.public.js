const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l3-p1",
    name: "getAt time travel",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0); m.put('a', 2, 10); t.eq(m.getAt('a', 5), 1); t.eq(m.getAt('a', 10), 2);
    },
  },
  {
    id: "om-l3-p2",
    name: "history lists versions",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 100); m.put('a', 2, 10, 100); t.eq(m.history('a'), [{ value: 1, timestamp: 0, expiresAt: 100 }, { value: 2, timestamp: 10, expiresAt: 110 }]);
    },
  },
  {
    id: "om-l3-p3",
    name: "getAt respects version ttl",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 5); t.eq(m.getAt('a', 3), 1); t.eq(m.getAt('a', 7), null);
    },
  },
  {
    id: "om-l3-p4",
    name: "getAt before first write",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 5); t.eq(m.getAt('a', 0), null);
    },
  },
];
