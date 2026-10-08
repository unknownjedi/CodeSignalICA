const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l2-p1",
    name: "transfer moves balance",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 100); l.transfer('a', 'b', 1, 30); t.eq(l.getBalance('a', 1), 70); t.eq(l.getBalance('b', 1), 30);
    },
  },
  {
    id: "cl-l2-p2",
    name: "insufficient transfer ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 10); l.transfer('a', 'b', 1, 30); t.eq(l.getBalance('b', 1), 0);
    },
  },
  {
    id: "cl-l2-p3",
    name: "ranking by volume",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 10); l.deposit('b', 0, 50); t.eq(l.getRanking(0), ['b', 'a']);
    },
  },
  {
    id: "cl-l2-p4",
    name: "transactions list",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 1, 10); t.eq(l.getTransactions('a'), [{ timestamp: 1, type: 'deposit', amount: 10 }]);
    },
  },
];
