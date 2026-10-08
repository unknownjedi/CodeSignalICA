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
}

module.exports = ObjectManager;
