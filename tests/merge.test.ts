import { describe, expect, it } from "vitest";
import { mergeStarterCode } from "@/lib/assessments/merge";

const LEVEL_1_STARTER = `class WorkingHours {
  addEmployee(id, position) {
    // TODO
  }
}

module.exports = WorkingHours;
`;

const LEVEL_2_STARTER = `class WorkingHours {
  addEmployee(id, position) {
    // TODO
  }

  topNEmployees(n, position) {
    // TODO
  }
}

module.exports = WorkingHours;
`;

describe("starter code merge", () => {
  it("returns the starter code when there is no previous code", () => {
    const result = mergeStarterCode(null, LEVEL_1_STARTER);
    expect(result.code).toBe(LEVEL_1_STARTER);
  });

  it("adds newly introduced methods without touching existing code", () => {
    const candidate = `class WorkingHours {
  addEmployee(id, position) {
    this.data = this.data || new Map();
    this.data.set(id, position);
  }
}

module.exports = WorkingHours;
`;

    const result = mergeStarterCode(candidate, LEVEL_2_STARTER);

    expect(result.added).toEqual(["WorkingHours.topNEmployees"]);
    expect(result.code).toContain("this.data.set(id, position);");
    expect(result.code).toContain("topNEmployees(n, position)");
    expect(result.code.indexOf("addEmployee")).toBeLessThan(
      result.code.indexOf("topNEmployees")
    );
  });

  it("keeps candidate implementations even when they differ from the starter", () => {
    const candidate = `class WorkingHours {
  addEmployee(id, position) {
    // candidate's own implementation
  }
}

module.exports = WorkingHours;
`;

    const result = mergeStarterCode(candidate, LEVEL_1_STARTER);
    expect(result.code).toBe(candidate);
    expect(result.added).toEqual([]);
  });

  it("appends a missing class and module.exports", () => {
    const candidate = `// candidate deleted everything
`;
    const result = mergeStarterCode(candidate, LEVEL_1_STARTER);

    expect(result.code).toContain("class WorkingHours");
    expect(result.code).toContain("module.exports = WorkingHours;");
    expect(result.added).toContain("WorkingHours");
    expect(result.added).toContain("module.exports");
  });

  it("falls back gracefully when the previous code has syntax errors", () => {
    const candidate = `class WorkingHours {
  addEmployee(id, position) {
    this.data = ;
  }
}
`;
    const result = mergeStarterCode(candidate, LEVEL_2_STARTER);

    expect(result.warning).toBeTruthy();
    expect(result.code).toContain("class WorkingHours");
    expect(result.code).toContain("module.exports = WorkingHours;");
  });

  it("handles functions and variable declarations", () => {
    const starter = `function helper(value) {
  return value;
}

const LIMIT = 10;

class WorkingHours {}

module.exports = WorkingHours;
`;
    const result = mergeStarterCode("const existing = 1;\n", starter);

    expect(result.code).toContain("function helper(value)");
    expect(result.code).toContain("const LIMIT = 10;");
    expect(result.code).toContain("class WorkingHours {}");
    expect(result.added).toEqual(["helper", "LIMIT", "WorkingHours", "module.exports"]);
  });
});
