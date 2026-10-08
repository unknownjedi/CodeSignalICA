class WorkingHours {
  constructor() {
    this.employees = new Map();
  }

  addEmployee(id, position) {
    if (this.employees.has(id)) {
      return;
    }
    this.employees.set(id, {
      id,
      position,
      inside: false,
      enterTime: null,
      completedTime: 0,
    });
  }

  record(employeeId, timestamp, type) {
    const employee = this.employees.get(employeeId);
    if (!employee) {
      return;
    }

    if (type === "enter") {
      if (employee.inside) {
        return;
      }
      employee.inside = true;
      employee.enterTime = timestamp;
    } else if (type === "exit") {
      if (!employee.inside) {
        return;
      }
      employee.inside = false;
      employee.completedTime += Math.max(0, timestamp - employee.enterTime);
      employee.enterTime = null;
    }
  }

  getWorkingTime(employeeId) {
    const employee = this.employees.get(employeeId);
    return employee ? employee.completedTime : 0;
  }

  topNEmployees(n, position) {
    if (!Number.isFinite(n) || n <= 0) {
      return [];
    }

    const matches = [];
    for (const employee of this.employees.values()) {
      if (employee.position === position) {
        matches.push({ id: employee.id, time: employee.completedTime });
      }
    }

    matches.sort((a, b) => {
      if (b.time !== a.time) {
        return b.time - a.time;
      }
      if (a.id < b.id) {
        return -1;
      }
      if (a.id > b.id) {
        return 1;
      }
      return 0;
    });

    return matches.slice(0, n).map((match) => match.id);
  }
}

module.exports = WorkingHours;
