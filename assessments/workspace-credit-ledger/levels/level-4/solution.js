class CreditLedger {
  constructor() {
    this.workspaces = new Map();
    this.aliases = new Map();
    this.seq = 0;
  }

  resolve(workspaceId) {
    let current = workspaceId;
    while (this.aliases.has(current)) current = this.aliases.get(current);
    return current;
  }

  createWorkspace(workspaceId) {
    if (this.workspaces.has(workspaceId)) return;
    this.workspaces.set(workspaceId, { id: workspaceId, events: [] });
  }

  deposit(workspaceId, timestamp, amount) {
    const workspace = this.workspaces.get(this.resolve(workspaceId));
    if (!workspace || amount <= 0) return;
    workspace.events.push({ seq: this.seq++, timestamp: timestamp, kind: 'deposit', delta: amount });
  }

  balanceOf(workspace, timestamp) {
    let total = 0;
    for (const event of workspace.events) {
      if (event.timestamp <= timestamp) total += event.delta;
    }
    return total;
  }

  getBalance(workspaceId, timestamp) {
    const workspace = this.workspaces.get(this.resolve(workspaceId));
    if (!workspace) return 0;
    return this.balanceOf(workspace, timestamp);
  }

  volumeOf(workspace, timestamp) {
    let total = 0;
    for (const event of workspace.events) {
      if (event.timestamp <= timestamp) total += Math.abs(event.delta);
    }
    return total;
  }

  transfer(fromId, toId, timestamp, amount) {
    const from = this.resolve(fromId);
    const to = this.resolve(toId);
    if (from === to || amount <= 0) return;
    const fromWorkspace = this.workspaces.get(from);
    const toWorkspace = this.workspaces.get(to);
    if (!fromWorkspace || !toWorkspace) return;
    if (this.balanceOf(fromWorkspace, timestamp) < amount) return;
    fromWorkspace.events.push({ seq: this.seq++, timestamp: timestamp, kind: 'transfer-out', delta: -amount });
    toWorkspace.events.push({ seq: this.seq++, timestamp: timestamp, kind: 'transfer-in', delta: amount });
  }

  getRanking(timestamp) {
    const self = this;
    const ids = [];
    for (const id of this.workspaces.keys()) {
      if (!this.aliases.has(id)) ids.push(id);
    }
    return ids
      .map(function (id) { return self.workspaces.get(id); })
      .sort(function (a, b) {
        const volumeA = self.volumeOf(a, timestamp);
        const volumeB = self.volumeOf(b, timestamp);
        if (volumeA !== volumeB) return volumeB - volumeA;
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      })
      .map(function (workspace) { return workspace.id; });
  }

  getTransactions(workspaceId) {
    const workspace = this.workspaces.get(this.resolve(workspaceId));
    if (!workspace) return [];
    return [...workspace.events]
      .sort(function (a, b) {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.seq - b.seq;
      })
      .map(function (event) {
        return { timestamp: event.timestamp, type: event.kind, amount: event.delta };
      });
  }

  spend(workspaceId, timestamp, amount, cashbackAmount, cashbackDelay) {
    const workspace = this.workspaces.get(this.resolve(workspaceId));
    if (!workspace || amount <= 0) return;
    if (this.balanceOf(workspace, timestamp) < amount) return;
    workspace.events.push({ seq: this.seq++, timestamp: timestamp, kind: 'spend', delta: -amount });
    if (cashbackAmount > 0) {
      workspace.events.push({ seq: this.seq++, timestamp: timestamp + cashbackDelay, kind: 'cashback', delta: cashbackAmount });
    }
  }

  getCashback(workspaceId, timestamp) {
    const workspace = this.workspaces.get(this.resolve(workspaceId));
    if (!workspace) return 0;
    let total = 0;
    for (const event of workspace.events) {
      if (event.kind === 'cashback' && event.timestamp <= timestamp) total += event.delta;
    }
    return total;
  }

  mergeWorkspaces(sourceId, targetId) {
    const source = this.resolve(sourceId);
    const target = this.resolve(targetId);
    if (source === target) return;
    const sourceWorkspace = this.workspaces.get(source);
    const targetWorkspace = this.workspaces.get(target);
    if (!sourceWorkspace || !targetWorkspace) return;
    for (const event of sourceWorkspace.events) targetWorkspace.events.push(event);
    sourceWorkspace.events = [];
    this.aliases.set(source, target);
  }

  getWorkspaceStatus(workspaceId) {
    const resolved = this.resolve(workspaceId);
    if (!this.workspaces.has(resolved)) return null;
    return this.aliases.has(workspaceId) ? 'merged' : 'active';
  }
}

module.exports = CreditLedger;
