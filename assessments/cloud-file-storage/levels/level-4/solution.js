class FileStore {
  constructor() {
    this.files = new Map();
    this.users = new Map();
  }

  addFile(fileName, size) {
    if (this.files.has(fileName)) return;
    if (size < 0) return;
    this.files.set(fileName, { name: fileName, size: size, owner: null, compressed: false, originalSize: size });
  }

  getFile(fileName) {
    const file = this.files.get(fileName);
    return file ? file.size : null;
  }

  compareFiles(a, b) {
    if (a.size !== b.size) return b.size - a.size;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  }

  findByPrefix(prefix) {
    const result = [];
    for (const file of this.files.values()) {
      if (file.name.indexOf(prefix) === 0) result.push(file);
    }
    return result.sort(this.compareFiles).map(function (file) { return file.name; });
  }

  findBySuffix(suffix) {
    const result = [];
    for (const file of this.files.values()) {
      if (suffix === '' || file.name.slice(-suffix.length) === suffix) result.push(file);
    }
    return result.sort(this.compareFiles).map(function (file) { return file.name; });
  }

  addUser(userId, capacity) {
    if (this.users.has(userId)) return;
    this.users.set(userId, { id: userId, capacity: capacity, usage: 0 });
  }

  getOwner(fileName) {
    const file = this.files.get(fileName);
    return file && file.owner ? file.owner : null;
  }

  getUsage(userId) {
    const user = this.users.get(userId);
    return user ? user.usage : 0;
  }

  assignOwner(fileName, userId) {
    const file = this.files.get(fileName);
    const user = this.users.get(userId);
    if (!file || !user) return;
    const previous = file.owner;
    const base = user.usage - (previous === userId ? file.size : 0);
    if (base + file.size > user.capacity) return;
    if (previous && previous !== userId && this.users.has(previous)) this.users.get(previous).usage -= file.size;
    if (previous !== userId) user.usage += file.size;
    file.owner = userId;
  }

  copyFile(source, dest) {
    const src = this.files.get(source);
    if (!src) return;
    const existing = this.files.get(dest);
    if (existing && existing.owner && this.users.has(existing.owner)) this.users.get(existing.owner).usage -= existing.size;
    this.files.set(dest, { name: dest, size: src.size, owner: null, compressed: false, originalSize: src.size });
  }

  compressFile(fileName) {
    const file = this.files.get(fileName);
    if (!file || file.compressed) return;
    const original = file.size;
    const compressed = Math.floor(original / 2);
    file.originalSize = original;
    file.size = compressed;
    file.compressed = true;
    if (file.owner && this.users.has(file.owner)) this.users.get(file.owner).usage -= (original - compressed);
  }

  decompressFile(fileName) {
    const file = this.files.get(fileName);
    if (!file || !file.compressed) return;
    if (file.owner && this.users.has(file.owner)) {
      const user = this.users.get(file.owner);
      if (user.usage - file.size + file.originalSize > user.capacity) return;
      user.usage += file.originalSize - file.size;
    }
    file.size = file.originalSize;
    file.compressed = false;
  }

  isCompressed(fileName) {
    const file = this.files.get(fileName);
    return file ? file.compressed : false;
  }
}

module.exports = FileStore;
