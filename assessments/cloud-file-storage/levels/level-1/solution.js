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
}

module.exports = FileStore;
