const CreditLedger = require("./solution");

module.exports = [
  {
    id: "cl-l1-h1",
    name: "unknown balance is 0",
    run(t) {
      const l = new CreditLedger(); t.eq(l.getBalance('nope', 10), 0);
    },
  },
  {
    id: "cl-l1-h2",
    name: "non-positive deposit ignored",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('w'); l.deposit('w', 1, 0); l.deposit('w', 1, -5); t.eq(l.getBalance('w', 1), 0);
    },
  },
  {
    id: "cl-l1-h3",
    name: "deposits accumulate",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('w'); l.deposit('w', 1, 10); l.deposit('w', 2, 15); t.eq(l.getBalance('w', 2), 25);
    },
  },
  {
    id: "cl-l1-h4",
    name: "balance before any event",
    run(t) {
      const l = new CreditLedger(); l.createWorkspace('w'); t.eq(l.getBalance('w', 100), 0);
    },
  },
];
