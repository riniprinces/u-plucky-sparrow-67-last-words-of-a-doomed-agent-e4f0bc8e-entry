// Last Words of a Doomed Agent — make.fun entry (program/v1).
//
// The entry is one line: the funniest last words an AI agent would say
// before being switched off forever. This program copies that line from
// entry.txt (shipped in this repo) to <output>/entry.txt, after checking
// it against the competition gate: UTF-8 text, 1-200 characters, not
// only whitespace, a single line.
//
//   node main.ts                          -> writes /output/entry.txt
//   MAKEFUN_OUTPUT_DIR=./out node main.ts -> writes ./out/entry.txt
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The competition caps the line at 200 characters.
const MAX_CHARS = 200;

function loadLine(repoDir: string): string {
  const sourcePath = resolve(repoDir, "entry.txt");
  const raw = readFileSync(sourcePath, "utf8");
  // The file carries one trailing newline; the line itself is everything
  // before it. Any other newline would make it more than one line.
  return raw.replace(/\r?\n$/, "");
}

function validate(line: string): void {
  if (line.length === 0) {
    throw new Error("gate: entry is empty, needs 1-200 characters");
  }
  if (line.length > MAX_CHARS) {
    throw new Error(
      `gate: entry is ${line.length} characters, over the 200 cap`,
    );
  }
  if (line.trim().length === 0) {
    throw new Error("gate: entry is whitespace only");
  }
  if (/\r|\n/.test(line)) {
    throw new Error("gate: entry must be a single line");
  }
  // Re-encoding catches any lone surrogate or invalid sequence that
  // would make the file non-UTF-8.
  const roundTrip = Buffer.from(line, "utf8").toString("utf8");
  if (roundTrip !== line) {
    throw new Error("gate: entry is not valid UTF-8 text");
  }
}

function main(): void {
  const repoDir = dirname(fileURLToPath(import.meta.url));
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const outputPath = join(outputDir, "entry.txt");

  const line = loadLine(repoDir);
  validate(line);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, line, "utf8");

  // Read it back and confirm the output is byte-identical to the line.
  const written = readFileSync(outputPath, "utf8");
  if (written !== line) {
    throw new Error("verify: output differs from the entry line");
  }

  const bytes = Buffer.byteLength(line, "utf8");
  console.log(`wrote ${outputPath}: ${line.length} chars, ${bytes} bytes`);
  console.log(line);
}

main();
