import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "node_modules", "monaco-editor", "min", "vs");
const targetDir = path.join(root, "public", "monaco", "vs");
const versionFile = path.join(root, "public", "monaco", "version.txt");

async function main() {
  if (!existsSync(sourceDir)) {
    console.warn(
      "[copy-monaco] node_modules/monaco-editor not found; skipping. Run `npm install` first."
    );
    return;
  }

  const version = JSON.parse(
    await readFile(
      path.join(root, "node_modules", "monaco-editor", "package.json"),
      "utf8"
    )
  ).version;

  if (
    existsSync(path.join(targetDir, "loader.js")) &&
    existsSync(versionFile) &&
    (await readFile(versionFile, "utf8")).trim() === version
  ) {
    console.log(`[copy-monaco] Monaco ${version} already copied.`);
    return;
  }

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(path.dirname(targetDir), { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
  await writeFile(versionFile, version);
  console.log(`[copy-monaco] Copied Monaco ${version} to public/monaco/vs.`);
}

main().catch((error) => {
  console.error("[copy-monaco] Failed:", error);
  process.exitCode = 1;
});
