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

  copyFile(source, dest) {
    const src = this.files.get(source);
    if (!src) return;
    this.files.set(dest, { name: dest, size: src.size, owner: null, compressed: false, originalSize: src.size });
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
}

module.exports = FileStore;
