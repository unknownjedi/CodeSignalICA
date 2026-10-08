import ts from "typescript";

export interface MergeResult {
  code: string;
  added: string[];
  warning?: string;
}

interface ClassInfo {
  node: ts.ClassDeclaration;
  members: Map<string, ts.ClassElement>;
}

interface CandidateIndex {
  classes: Map<string, ClassInfo>;
  functions: Set<string>;
  variables: Set<string>;
  hasModuleExports: boolean;
}

interface TextEdit {
  position: number;
  text: string;
}

function parse(source: string): ts.SourceFile {
  return ts.createSourceFile(
    "source.js",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );
}

function parseDiagnostics(sourceFile: ts.SourceFile): ts.Diagnostic[] {
  return (
    (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] })
      .parseDiagnostics ?? []
  );
}

function memberName(member: ts.ClassElement): string | null {
  const name = member.name;
  if (!name) {
    return null;
  }
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name) ||
    ts.isPrivateIdentifier(name)
  ) {
    return name.text;
  }
  return name.getText();
}

function declarationName(node: ts.Node): string | null {
  if (
    (ts.isClassDeclaration(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isEnumDeclaration(node)) &&
    node.name
  ) {
    return node.name.text;
  }
  return null;
}

function isModuleExportsStatement(statement: ts.Statement): boolean {
  if (!ts.isExpressionStatement(statement)) {
    return false;
  }
  const expression = statement.expression;
  return (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    expression.left.getText().startsWith("module.exports")
  );
}

function buildIndex(sourceFile: ts.SourceFile): CandidateIndex {
  const index: CandidateIndex = {
    classes: new Map(),
    functions: new Set(),
    variables: new Set(),
    hasModuleExports: false,
  };

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const name = declarationName(statement);
      if (!name) {
        continue;
      }
      const members = new Map<string, ts.ClassElement>();
      for (const member of statement.members) {
        const name = memberName(member);
        if (name) {
          members.set(name, member);
        }
      }
      index.classes.set(name, { node: statement, members });
    } else if (ts.isFunctionDeclaration(statement)) {
      const name = declarationName(statement);
      if (name) {
        index.functions.add(name);
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          index.variables.add(declaration.name.text);
        }
      }
    } else if (isModuleExportsStatement(statement)) {
      index.hasModuleExports = true;
    }
  }

  return index;
}

function indentMember(text: string): string {
  return text
    .split("\n")
    .map((line, i) => (i === 0 ? `  ${line}` : line))
    .join("\n");
}

function variableDeclarationText(
  statement: ts.VariableStatement,
  declaration: ts.VariableDeclaration
): string {
  const flags = statement.declarationList.flags;
  const keyword = (flags & ts.NodeFlags.Const) !== 0 ? "const" : (flags & ts.NodeFlags.Let) !== 0 ? "let" : "var";
  return `${keyword} ${declaration.getText()};`;
}

export function mergeStarterCode(
  previousCode: string | null,
  starterCode: string
): MergeResult {
  if (!previousCode || previousCode.trim() === "") {
    return { code: starterCode, added: [] };
  }

  const candidateFile = parse(previousCode);
  const starterFile = parse(starterCode);

  if (parseDiagnostics(candidateFile).length > 0) {
    return syntaxErrorFallback(previousCode, starterCode, starterFile);
  }

  const index = buildIndex(candidateFile);
  const edits: TextEdit[] = [];
  const appended: string[] = [];
  const added: string[] = [];

  for (const statement of starterFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const name = declarationName(statement);
      if (!name) {
        continue;
      }
      const existing = index.classes.get(name);
      if (!existing) {
        appended.push(statement.getText());
        added.push(name);
        continue;
      }
      const missing: ts.ClassElement[] = [];
      for (const member of statement.members) {
        const currentMemberName = memberName(member);
        if (!currentMemberName || existing.members.has(currentMemberName)) {
          continue;
        }
        missing.push(member);
        added.push(`${name}.${currentMemberName}`);
      }
      if (missing.length > 0) {
        const closingBrace = existing.node.end - 1;
        const body = missing.map((member) => indentMember(member.getText())).join("\n\n");
        edits.push({ position: closingBrace, text: `\n${body}\n` });
      }
    } else if (ts.isFunctionDeclaration(statement)) {
      const name = declarationName(statement);
      if (!name || index.functions.has(name)) {
        continue;
      }
      appended.push(statement.getText());
      added.push(name);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }
        if (index.variables.has(declaration.name.text)) {
          continue;
        }
        appended.push(variableDeclarationText(statement, declaration));
        added.push(declaration.name.text);
      }
    } else if (isModuleExportsStatement(statement) && !index.hasModuleExports) {
      appended.push(statement.getText());
      added.push("module.exports");
    }
  }

  if (edits.length === 0 && appended.length === 0) {
    return { code: previousCode, added: [] };
  }

  const sorted = [...edits].sort((a, b) => b.position - a.position);
  let merged = previousCode;
  for (const edit of sorted) {
    merged = merged.slice(0, edit.position) + edit.text + merged.slice(edit.position);
  }
  if (appended.length > 0) {
    merged = `${merged.replace(/\s+$/, "")}\n\n${appended.join("\n\n")}\n`;
  }

  return { code: merged, added };
}

function syntaxErrorFallback(
  previousCode: string,
  starterCode: string,
  starterFile: ts.SourceFile
): MergeResult {
  let merged = previousCode;
  const added: string[] = [];

  for (const statement of starterFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const name = declarationName(statement);
      if (name && !new RegExp(`\\bclass\\s+${name}\\b`).test(previousCode)) {
        merged = `${merged.replace(/\s+$/, "")}\n\n${statement.getText()}\n`;
        added.push(name);
      }
    }
  }
  if (!/\bmodule\.exports\b/.test(previousCode) && /\bmodule\.exports\b/.test(starterCode)) {
    const exportsStatement = starterFile.statements.find(isModuleExportsStatement);
    if (exportsStatement) {
      merged = `${merged.replace(/\s+$/, "")}\n\n${exportsStatement.getText()}\n`;
      added.push("module.exports");
    }
  }

  return {
    code: merged,
    added,
    warning:
      "Your previous level's code contains syntax errors, so new method stubs could not be merged automatically. Fix the syntax and re-open this level, or add the stubs manually.",
  };
}
