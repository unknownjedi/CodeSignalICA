const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l4-h1",
    name: "unknown merge ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 10); l.mergeWorkspaces('a', 'zz'); t.eq(l.getBalance('a', 0), 10);
    },
  },
  {
    id: "cl-l4-h2",
    name: "ranking excludes merged",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 10); l.mergeWorkspaces('a', 'b'); t.eq(l.getRanking(0), ['b']);
    },
  },
  {
    id: "cl-l4-h3",
    name: "transactions combine after merge",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 1, 10); l.deposit('b', 2, 20); l.mergeWorkspaces('a', 'b'); t.eq(l.getTransactions('b').length, 2);
    },
  },
  {
    id: "cl-l4-h4",
    name: "deposit to source after merge",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.mergeWorkspaces('a', 'b'); l.deposit('a', 0, 25); t.eq(l.getBalance('b', 0), 25);
    },
  },
  {
    id: "cl-l4-h5",
    name: "merge chains",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.createWorkspace('c'); l.deposit('a', 0, 1); l.deposit('b', 0, 2); l.mergeWorkspaces('a', 'b'); l.mergeWorkspaces('b', 'c'); t.eq(l.getBalance('c', 0), 3);
    },
  },
  {
    id: "cl-l4-h6",
    name: "regression: cashback after merge",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 100); l.spend('a', 1, 30, 10, 5); l.mergeWorkspaces('a', 'b'); t.eq(l.getBalance('b', 6), 80);
    },
  },
];
