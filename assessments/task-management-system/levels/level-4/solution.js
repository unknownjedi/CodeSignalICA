class TaskManager {
  constructor() {
    this.tasks = new Map();
    this.users = new Map();
    this.assignments = new Map();
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

  addUser(userId, quota) {
    if (this.users.has(userId)) return;
    this.users.set(userId, { id: userId, quota: quota });
  }

  isActive(assignment, timestamp) {
    return assignment.status === 'active' && assignment.expiresAt > timestamp;
  }

  assignTask(userId, taskId, timestamp, ttl) {
    if (!this.users.has(userId) || !this.tasks.has(taskId)) return;
    const existing = this.assignments.get(taskId);
    if (existing && this.isActive(existing, timestamp)) return;
    let activeCount = 0;
    for (const assignment of this.assignments.values()) {
      if (assignment.userId === userId && this.isActive(assignment, timestamp)) activeCount += 1;
    }
    if (activeCount >= this.users.get(userId).quota) return;
    this.assignments.set(taskId, {
      taskId: taskId,
      userId: userId,
      assignedAt: timestamp,
      expiresAt: timestamp + ttl,
      status: 'active',
    });
  }

  getAssignments(userId, timestamp) {
    const result = [];
    for (const assignment of this.assignments.values()) {
      if (assignment.userId === userId && this.isActive(assignment, timestamp)) {
        result.push(assignment.taskId);
      }
    }
    return result.sort();
  }

  completeTask(userId, taskId, timestamp) {
    const assignment = this.assignments.get(taskId);
    if (!assignment || assignment.userId !== userId) return;
    if (!this.isActive(assignment, timestamp)) return;
    assignment.status = 'completed';
    assignment.completedAt = timestamp;
  }

  getOverdueAssignments(timestamp) {
    const result = [];
    for (const assignment of this.assignments.values()) {
      if (assignment.status === 'active' && assignment.expiresAt <= timestamp) {
        result.push(assignment.taskId);
      }
    }
    return result.sort();
  }
}

module.exports = TaskManager;
