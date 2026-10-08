class TaskManager {
  constructor() {
    this.tasks = new Map();
  }

  addTask(id, name, priority) {
    if (this.tasks.has(id)) return;
    this.tasks.set(id, { id: id, name: name, priority: priority });
  }

  updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (!task || !updates) return;
    if (Object.prototype.hasOwnProperty.call(updates, 'name')) task.name = updates.name;
    if (Object.prototype.hasOwnProperty.call(updates, 'priority')) task.priority = updates.priority;
  }

  getTask(id) {
    const task = this.tasks.get(id);
    if (!task) return null;
    return { id: task.id, name: task.name, priority: task.priority };
  }

  compare(a, b) {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  }

  listTasks() {
    return [...this.tasks.values()].sort(this.compare).map(function (task) { return task.id; });
  }

  searchTasks(nameQuery) {
    const query = String(nameQuery).toLowerCase();
    return [...this.tasks.values()]
      .filter(function (task) { return task.name.toLowerCase().indexOf(query) !== -1; })
      .sort(this.compare)
      .map(function (task) { return task.id; });
  }
}

module.exports = TaskManager;
