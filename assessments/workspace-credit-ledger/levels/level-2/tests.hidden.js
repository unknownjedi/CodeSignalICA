const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l2-h1",
    name: "self transfer ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 10); l.transfer('a', 'a', 1, 5); t.eq(l.getBalance('a', 1), 10);
    },
  },
  {
    id: "cl-l2-h2",
    name: "unknown transfer ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 10); l.transfer('a', 'zz', 1, 5); t.eq(l.getBalance('a', 1), 10);
    },
  },
  {
    id: "cl-l2-h3",
    name: "historical balance after transfer",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 100); l.transfer('a', 'b', 5, 30); t.eq(l.getBalance('b', 4), 0); t.eq(l.getBalance('b', 5), 30);
    },
  },
  {
    id: "cl-l2-h4",
    name: "ranking tie by id",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('z'); l.createWorkspace('a'); l.deposit('z', 0, 5); l.deposit('a', 0, 5); t.eq(l.getRanking(0), ['a', 'z']);
    },
  },
  {
    id: "cl-l2-h5",
    name: "transactions sorted by timestamp",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 9, 1); l.deposit('a', 2, 2); t.eq(l.getTransactions('a').map(function (e) { return e.timestamp; }), [2, 9]);
    },
  },
  {
    id: "cl-l2-h6",
    name: "regression: balance point in time",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 3, 7); t.eq(l.getBalance('a', 2), 0); t.eq(l.getBalance('a', 3), 7);
    },
  },
];
