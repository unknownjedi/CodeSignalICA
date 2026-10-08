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
}

module.exports = TaskManager;
