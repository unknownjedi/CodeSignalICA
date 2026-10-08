const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l2-h1",
    name: "volume accumulates across deposits",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 10); b.deposit('a', 10); b.deposit('c', 15); t.eq(b.getRanking(), ['a', 'c']);
    },
  },
  {
    id: "bk-l2-h2",
    name: "zero volume still ranked by id",
    run(t) {
      const b = new Bank(); b.createAccount('z'); b.createAccount('a'); t.eq(b.getRanking(), ['a', 'z']);
    },
  },
  {
    id: "bk-l2-h3",
    name: "regression: balances",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 7); t.eq(b.getBalance('a'), 7);
    },
  },
  {
    id: "bk-l2-h4",
    name: "three-way tie",
    run(t) {
      const b = new Bank(); b.createAccount('c'); b.createAccount('b'); b.createAccount('a'); t.eq(b.getRanking(), ['a', 'b', 'c']);
    },
  },
];
