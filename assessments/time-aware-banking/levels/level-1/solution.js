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
}

module.exports = Bank;
