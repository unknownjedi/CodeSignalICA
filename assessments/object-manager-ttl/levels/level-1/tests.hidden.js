const ObjectManager = require("./solution");

module.exports = [
  {
    id: "om-l1-h1",
    name: "delete missing is a no-op",
    run(t) {
      const m = new ObjectManager(); m.delete('x'); t.eq(m.get('x'), null);
    },
  },
  {
    id: "om-l1-h2",
    name: "multiple keys are independent",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.put('b', 2); t.eq(m.get('a'), 1); t.eq(m.get('b'), 2);
    },
  },
  {
    id: "om-l1-h3",
    name: "object values deep equality",
    run(t) {
      const m = new ObjectManager(); m.put('a', { x: 1, y: [2, 3] }); t.eq(m.get('a'), { x: 1, y: [2, 3] });
    },
  },
  {
    id: "om-l1-h4",
    name: "put after delete",
    run(t) {
      const m = new ObjectManager(); m.put('a', 1); m.delete('a'); m.put('a', 9); t.eq(m.get('a'), 9);
    },
  },
];
