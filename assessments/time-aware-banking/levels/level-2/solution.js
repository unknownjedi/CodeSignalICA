class Bank {
  constructor() {
    this.accounts = new Map();
    this.transfers = new Map();
    this.aliases = new Map();
  }

  resolve(accountId) {
    let current = accountId;
    while (this.aliases.has(current)) current = this.aliases.get(current);
    return current;
  }

  createAccount(accountId) {
    if (this.accounts.has(accountId)) return;
    this.accounts.set(accountId, { id: accountId, balance: 0, volume: 0 });
  }

  deposit(accountId, amount) {
    const account = this.accounts.get(this.resolve(accountId));
    if (!account || amount <= 0) return;
    account.balance += amount;
    account.volume += amount;
  }

  getBalance(accountId) {
    const account = this.accounts.get(this.resolve(accountId));
    return account ? account.balance : 0;
  }

  getRanking() {
    const ids = [];
    for (const id of this.accounts.keys()) {
      if (!this.aliases.has(id)) ids.push(id);
    }
    const self = this;
    return ids
      .map(function (id) { return self.accounts.get(id); })
      .sort(function (a, b) {
        if (a.volume !== b.volume) return b.volume - a.volume;
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      })
      .map(function (account) { return account.id; });
  }
}

module.exports = Bank;
