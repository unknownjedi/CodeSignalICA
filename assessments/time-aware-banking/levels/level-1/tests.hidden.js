const Bank = require("./solution");

module.exports = [
  {
    id: "bk-l1-h1",
    name: "unknown balance is 0",
    run(t) {
      const b = new Bank(); t.eq(b.getBalance('nope'), 0);
    },
  },
  {
    id: "bk-l1-h2",
    name: "new account starts at 0",
    run(t) {
      const b = new Bank(); b.createAccount('a'); t.eq(b.getBalance('a'), 0);
    },
  },
  {
    id: "bk-l1-h3",
    name: "multiple deposits accumulate",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.deposit('a', 10); b.deposit('a', 15); t.eq(b.getBalance('a'), 25);
    },
  },
  {
    id: "bk-l1-h4",
    name: "independent accounts",
    run(t) {
      const b = new Bank(); b.createAccount('a'); b.createAccount('c'); b.deposit('a', 10); b.deposit('c', 4); t.eq(b.getBalance('a'), 10); t.eq(b.getBalance('c'), 4);
    },
  },
];
