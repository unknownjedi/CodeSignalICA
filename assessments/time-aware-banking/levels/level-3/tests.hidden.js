const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l3-h1",
    name: "duplicate transfer id ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); b.initiateTransfer('t1', 'a', 'c', 50, 0, 10); b.acceptTransfer('t1', 1); t.eq(b.getBalance('c'), 30);
    },
  },
  {
    id: "bk-l3-h2",
    name: "accept twice ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); b.acceptTransfer('t1', 1); b.acceptTransfer('t1', 2); t.eq(b.getBalance('c'), 30);
    },
  },
  {
    id: "bk-l3-h3",
    name: "self transfer ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'a', 30, 0, 10); t.eq(b.getTransferStatus('t1'), null);
    },
  },
  {
    id: "bk-l3-h4",
    name: "amount held while pending",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); t.eq(b.getBalance('a'), 70); t.eq(b.getBalance('c'), 0);
    },
  },
  {
    id: "bk-l3-h5",
    name: "unknown accounts ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 10); b.initiateTransfer('t1', 'a', 'zz', 5, 0, 10); t.eq(b.getTransferStatus('t1'), null);
    },
  },
  {
    id: "bk-l3-h6",
    name: "volume grows on accept",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); b.acceptTransfer('t1', 1); t.eq(b.getRanking(), ['a', 'c']);
    },
  },
  {
    id: "bk-l3-h7",
    name: "regression: ranking before accept",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.deposit('c', 10); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); t.eq(b.getRanking(), ['a', 'c']);
    },
  },
];
