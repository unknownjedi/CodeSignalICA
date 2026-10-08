const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l4-h1",
    name: "unknown merge ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 10); b.mergeAccounts('a', 'zz'); t.eq(b.getBalance('a'), 10);
    },
  },
  {
    id: "bk-l4-h2",
    name: "ranking excludes merged source",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 10); b.mergeAccounts('a', 'c'); t.eq(b.getRanking(), ['c']);
    },
  },
  {
    id: "bk-l4-h3",
    name: "deposit to source after merge",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.mergeAccounts('a', 'c'); b.deposit('a', 25); t.eq(b.getBalance('c'), 25);
    },
  },
  {
    id: "bk-l4-h4",
    name: "merge chains",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('b'); b.createAccount('c'); b.deposit('a', 1); b.deposit('b', 2); b.mergeAccounts('a', 'b'); b.mergeAccounts('b', 'c'); t.eq(b.getBalance('a'), 3); t.eq(b.getBalance('c'), 3);
    },
  },
  {
    id: "bk-l4-h5",
    name: "transfer involving merged account resolves",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.createAccount('d'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'd', 30, 0, 100); b.mergeAccounts('a', 'c'); b.acceptTransfer('t1', 10); t.eq(b.getBalance('c'), 70); t.eq(b.getBalance('d'), 30);
    },
  },
  {
    id: "bk-l4-h6",
    name: "regression: transfer expiry after merge",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.createAccount('d'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'd', 30, 0, 10); b.mergeAccounts('a', 'c'); b.acceptTransfer('t1', 10); t.eq(b.getBalance('c'), 100);
    },
  },
  {
    id: "bk-l4-h7",
    name: "regression: deposit and ranking",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 5); t.eq(b.getRanking(), ['a']); t.eq(b.getBalance('a'), 5);
    },
  },
];
