const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l2-p1",
    name: "ranks by volume",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 10); b.deposit('c', 50); t.eq(b.getRanking(), ['c', 'a']);
    },
  },
  {
    id: "bk-l2-p2",
    name: "ties sorted by id",
    run(t) {
      const b = new Bank(); b.createAccount('z'); b.createAccount('a'); b.deposit('z', 5); b.deposit('a', 5); t.eq(b.getRanking(), ['a', 'z']);
    },
  },
  {
    id: "bk-l2-p3",
    name: "single account",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 1); t.eq(b.getRanking(), ['a']);
    },
  },
  {
    id: "bk-l2-p4",
    name: "no accounts",
    run(t) {
      const b = new Bank(); t.eq(b.getRanking(), []);
    },
  },
];
