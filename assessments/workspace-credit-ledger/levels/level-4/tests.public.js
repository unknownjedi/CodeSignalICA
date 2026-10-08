const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l4-p1",
    name: "merge sums balances",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 0, 40); l.deposit('b', 0, 10); l.mergeWorkspaces('a', 'b'); t.eq(l.getBalance('b', 1), 50);
    },
  },
  {
    id: "cl-l4-p2",
    name: "merge preserves history",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.deposit('a', 1, 10); l.deposit('b', 2, 20); l.mergeWorkspaces('a', 'b'); t.eq(l.getBalance('b', 1), 10); t.eq(l.getBalance('b', 2), 30);
    },
  },
  {
    id: "cl-l4-p3",
    name: "status",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.createWorkspace('b'); l.mergeWorkspaces('a', 'b'); t.eq(l.getWorkspaceStatus('a'), 'merged'); t.eq(l.getWorkspaceStatus('b'), 'active');
    },
  },
  {
    id: "cl-l4-p4",
    name: "self merge ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 10); l.mergeWorkspaces('a', 'a'); t.eq(l.getBalance('a', 0), 10);
    },
  },
];
