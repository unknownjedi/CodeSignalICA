import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "assessment-data-"));
process.env.CODEASSESSMENT_DATA_DIR = dataDir;
