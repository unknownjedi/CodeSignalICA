const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l1-p1",
    name: "create deposit and balance",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 100); t.eq(b.getBalance('a'), 100);
    },
  },
  {
    id: "bk-l1-p2",
    name: "duplicate account ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 50); b.createAccount('a'); t.eq(b.getBalance('a'), 50);
    },
  },
  {
    id: "bk-l1-p3",
    name: "unknown deposit ignored",
    run(t) {
      const b = new Bank(); b.deposit('x', 10); t.eq(b.getBalance('x'), 0);
    },
  },
  {
    id: "bk-l1-p4",
    name: "non-positive deposit ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 0); b.deposit('a', -5); t.eq(b.getBalance('a'), 0);
    },
  },
];
