class ObjectManager {
  constructor() {
    this.store = new Map();
    this.snapshots = new Map();
    this.seq = 0;
  }

  put(key, value, timestamp, ttl) {
    const ts = timestamp === undefined ? 0 : timestamp;
    const expiresAt = ttl === undefined || ttl === null ? Infinity : ts + ttl;
    if (!this.store.has(key)) this.store.set(key, []);
    this.store.get(key).push({ value: value, timestamp: ts, seq: this.seq++, expiresAt: expiresAt });
  }

  latest(key) {
    const versions = this.store.get(key);
    if (!versions || versions.length === 0) return null;
    return versions[versions.length - 1];
  }

  get(key, timestamp) {
    const version = this.latest(key);
    if (!version) return null;
    if (timestamp === undefined) return version.value;
    return version.expiresAt > timestamp ? version.value : null;
  }

  delete(key) {
    this.store.delete(key);
  }

  keys(timestamp) {
    const result = [];
    for (const key of this.store.keys()) {
      const version = this.latest(key);
      if (version && version.expiresAt > timestamp) result.push(key);
    }
    return result.sort();
  }

  getAt(key, timestamp) {
    const versions = this.store.get(key);
    if (!versions) return null;
    let chosen = null;
    for (const version of versions) {
      if (version.timestamp <= timestamp) chosen = version;
    }
    if (!chosen) return null;
    return chosen.expiresAt > timestamp ? chosen.value : null;
  }

  history(key) {
    const versions = this.store.get(key);
    if (!versions) return [];
    return [...versions]
      .sort(function (a, b) {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.seq - b.seq;
      })
      .map(function (version) {
        return { value: version.value, timestamp: version.timestamp, expiresAt: version.expiresAt };
      });
  }

  cloneStore() {
    const copy = new Map();
    for (const [key, versions] of this.store.entries()) {
      copy.set(key, versions.map(function (version) {
        return { value: version.value, timestamp: version.timestamp, seq: version.seq, expiresAt: version.expiresAt };
      }));
    }
    return copy;
  }

  snapshot(snapshotId) {
    this.snapshots.set(snapshotId, this.cloneStore());
  }

  restore(snapshotId) {
    const saved = this.snapshots.get(snapshotId);
    if (!saved) return;
    const copy = new Map();
    for (const [key, versions] of saved.entries()) {
      copy.set(key, versions.map(function (version) {
        return { value: version.value, timestamp: version.timestamp, seq: version.seq, expiresAt: version.expiresAt };
      }));
    }
    this.store = copy;
  }

  listSnapshots() {
    return [...this.snapshots.keys()].sort();
  }
}

module.exports = ObjectManager;
