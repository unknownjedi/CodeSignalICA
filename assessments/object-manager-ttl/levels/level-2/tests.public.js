const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l2-p1",
    name: "ttl expires",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 10); t.eq(m.get('a', 5), 1); t.eq(m.get('a', 10), null);
    },
  },
  {
    id: "om-l2-p2",
    name: "no timestamp ignores expiry",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 1); t.eq(m.get('a'), 1);
    },
  },
  {
    id: "om-l2-p3",
    name: "keys respects ttl",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0, 5); m.put('b', 2, 0, 100); t.eq(m.keys(10), ['b']);
    },
  },
  {
    id: "om-l2-p4",
    name: "no ttl never expires",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1, 0); t.eq(m.get('a', 9999), 1);
    },
  },
];
