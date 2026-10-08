const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l1-p1",
    name: "put and get",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); t.eq(m.get('a'), 1);
    },
  },
  {
    id: "om-l1-p2",
    name: "update overwrites",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.put('a', 2); t.eq(m.get('a'), 2);
    },
  },
  {
    id: "om-l1-p3",
    name: "delete removes",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.delete('a'); t.eq(m.get('a'), null);
    },
  },
  {
    id: "om-l1-p4",
    name: "missing key is null",
    run(t) {
      const m = new ObjectManager(); t.eq(m.get('x'), null);
    },
  },
];
