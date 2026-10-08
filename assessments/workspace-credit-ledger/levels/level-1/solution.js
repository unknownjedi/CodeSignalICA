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
}

module.exports = CreditLedger;
