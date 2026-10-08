const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l3-h1",
    name: "cashback boundary inclusive",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 100); l.spend('a', 1, 30, 10, 5); t.eq(l.getBalance('a', 6), 80); t.eq(l.getCashback('a', 6), 10);
    },
  },
  {
    id: "cl-l3-h2",
    name: "getCashback before any",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); t.eq(l.getCashback('a', 100), 0);
    },
  },
  {
    id: "cl-l3-h3",
    name: "non-positive spend ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 10); l.spend('a', 1, 0, 0, 0); t.eq(l.getBalance('a', 1), 10);
    },
  },
  {
    id: "cl-l3-h4",
    name: "spend with zero cashback",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 100); l.spend('a', 1, 30, 0, 5); t.eq(l.getBalance('a', 100), 70);
    },
  },
  {
    id: "cl-l3-h5",
    name: "ranking counts cashback once credited",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 100); l.deposit('b', 0, 100); l.spend('a', 1, 50, 40, 10); t.eq(l.getRanking(11), ['a', 'b']);
    },
  },
  {
    id: "cl-l3-h6",
    name: "regression: transfer history",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 100); l.transfer('a', 'b', 1, 30); t.eq(l.getTransactions('b').map(function (e) { return e.type; }), ['transfer-in']);
    },
  },
];
