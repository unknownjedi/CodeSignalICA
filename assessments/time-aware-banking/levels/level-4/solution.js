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

  initiateTransfer(transferId, fromId, toId, amount, timestamp, expiresAt) {
    if (this.transfers.has(transferId)) return;
    if (amount <= 0) return;
    const from = this.accounts.get(this.resolve(fromId));
    const to = this.accounts.get(this.resolve(toId));
    if (!from || !to || from.id === to.id) return;
    if (from.balance < amount) return;
    from.balance -= amount;
    this.transfers.set(transferId, {
      id: transferId,
      from: fromId,
      to: toId,
      amount: amount,
      timestamp: timestamp,
      expiresAt: expiresAt,
      status: 'pending',
    });
  }

  acceptTransfer(transferId, timestamp) {
    const transfer = this.transfers.get(transferId);
    if (!transfer || transfer.status !== 'pending') return;
    const from = this.accounts.get(this.resolve(transfer.from));
    const to = this.accounts.get(this.resolve(transfer.to));
    if (timestamp >= transfer.expiresAt) {
      transfer.status = 'expired';
      if (from) from.balance += transfer.amount;
      return;
    }
    if (!from || !to) return;
    to.balance += transfer.amount;
    transfer.status = 'accepted';
    from.volume += transfer.amount;
    to.volume += transfer.amount;
  }

  getTransferStatus(transferId) {
    const transfer = this.transfers.get(transferId);
    return transfer ? transfer.status : null;
  }

  mergeAccounts(sourceId, targetId) {
    const source = this.resolve(sourceId);
    const target = this.resolve(targetId);
    if (source === target) return;
    const sourceAccount = this.accounts.get(source);
    const targetAccount = this.accounts.get(target);
    if (!sourceAccount || !targetAccount) return;
    targetAccount.balance += sourceAccount.balance;
    targetAccount.volume += sourceAccount.volume;
    sourceAccount.balance = 0;
    sourceAccount.volume = 0;
    this.aliases.set(source, target);
  }
}

module.exports = Bank;
