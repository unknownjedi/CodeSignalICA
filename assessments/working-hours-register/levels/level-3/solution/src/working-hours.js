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
      salary: 0,
      inside: false,
      enterTime: null,
      sessionRate: 0,
      completedTime: 0,
      sessions: [],
      pendingPromotion: null,
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
      if (employee.pendingPromotion) {
        employee.position = employee.pendingPromotion.position;
        employee.salary = employee.pendingPromotion.salary;
        employee.pendingPromotion = null;
      }
      employee.sessionRate = employee.salary;
    } else if (type === "exit") {
      if (!employee.inside) {
        return;
      }
      employee.inside = false;
      employee.completedTime += Math.max(0, timestamp - employee.enterTime);
      employee.sessions.push({
        enter: employee.enterTime,
        exit: timestamp,
        rate: employee.sessionRate,
      });
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

  promote(employeeId, newPosition, newSalary) {
    const employee = this.employees.get(employeeId);
    if (!employee) {
      return;
    }
    employee.pendingPromotion = { position: newPosition, salary: newSalary };
  }

  calculateSalary(employeeId, startTime, endTime) {
    const employee = this.employees.get(employeeId);
    if (!employee || endTime <= startTime) {
      return 0;
    }

    let total = 0;
    for (const session of employee.sessions) {
      const overlap = Math.max(
        0,
        Math.min(session.exit, endTime) - Math.max(session.enter, startTime)
      );
      total += session.rate * overlap;
    }
    return total;
  }
}

module.exports = WorkingHours;
