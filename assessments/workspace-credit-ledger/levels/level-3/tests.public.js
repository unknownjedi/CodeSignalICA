const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l3-p1",
    name: "spend reduces balance",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 100); l.spend('a', 1, 30, 0, 0); t.eq(l.getBalance('a', 1), 70);
    },
  },
  {
    id: "cl-l3-p2",
    name: "cashback after delay",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 100); l.spend('a', 1, 30, 10, 5); t.eq(l.getBalance('a', 6), 80);
    },
  },
  {
    id: "cl-l3-p3",
    name: "cashback not before delay",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 100); l.spend('a', 1, 30, 10, 5); t.eq(l.getBalance('a', 5), 70);
    },
  },
  {
    id: "cl-l3-p4",
    name: "insufficient spend ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('a'); l.deposit('a', 0, 10); l.spend('a', 1, 30, 0, 0); t.eq(l.getBalance('a', 1), 10);
    },
  },
];
