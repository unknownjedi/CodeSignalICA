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
      employee.sessionRate = employee.salary;
      if (employee.pendingPromotion) {
        employee.position = employee.pendingPromotion.position;
        employee.salary = employee.pendingPromotion.salary;
        employee.sessionRate = employee.salary;
        employee.pendingPromotion = null;
      }
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
}

module.exports = WorkingHours;
