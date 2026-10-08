const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l4-p1",
    name: "merge sums balances",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 40); b.deposit('c', 10); b.mergeAccounts('a', 'c'); t.eq(b.getBalance('c'), 50);
    },
  },
  {
    id: "bk-l4-p2",
    name: "merge sums volume",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 40); b.deposit('c', 10); b.mergeAccounts('a', 'c'); t.eq(b.getRanking(), ['c']);
    },
  },
  {
    id: "bk-l4-p3",
    name: "source resolves to target",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 40); b.mergeAccounts('a', 'c'); t.eq(b.getBalance('a'), 40);
    },
  },
  {
    id: "bk-l4-p4",
    name: "self merge ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 10); b.mergeAccounts('a', 'a'); t.eq(b.getBalance('a'), 10);
    },
  },
];
