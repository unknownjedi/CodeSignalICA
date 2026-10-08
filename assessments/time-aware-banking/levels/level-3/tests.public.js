const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l3-p1",
    name: "initiate and accept",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); b.acceptTransfer('t1', 5); t.eq(b.getBalance('a'), 70); t.eq(b.getBalance('c'), 30);
    },
  },
  {
    id: "bk-l3-p2",
    name: "insufficient funds ignored",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 20); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); t.eq(b.getTransferStatus('t1'), null); t.eq(b.getBalance('a'), 20);
    },
  },
  {
    id: "bk-l3-p3",
    name: "expired accept refunds",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); b.acceptTransfer('t1', 10); t.eq(b.getBalance('a'), 100); t.eq(b.getBalance('c'), 0); t.eq(b.getTransferStatus('t1'), 'expired');
    },
  },
  {
    id: "bk-l3-p4",
    name: "status of pending",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 100); b.initiateTransfer('t1', 'a', 'c', 30, 0, 10); t.eq(b.getTransferStatus('t1'), 'pending');
    },
  },
];
