const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l1-p1",
    name: "deposit and balance",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('w'); l.deposit('w', 1, 100); t.eq(l.getBalance('w', 1), 100);
    },
  },
  {
    id: "cl-l1-p2",
    name: "point in time balance",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('w'); l.deposit('w', 5, 50); t.eq(l.getBalance('w', 4), 0); t.eq(l.getBalance('w', 5), 50);
    },
  },
  {
    id: "cl-l1-p3",
    name: "duplicate create ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('w'); l.deposit('w', 1, 10); l.createWorkspace('w'); t.eq(l.getBalance('w', 1), 10);
    },
  },
  {
    id: "cl-l1-p4",
    name: "unknown deposit ignored",
    run(t) {
      const l = new CreditLedger(); l.deposit('x', 1, 10); t.eq(l.getBalance('x', 1), 0);
    },
  },
];
