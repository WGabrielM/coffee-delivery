// Exposes every skill in .agents/skills to Claude Code, which only loads .claude/skills.
// Creates one link per skill (junction on Windows, symlink elsewhere). Safe to re-run.
import { existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, ".agents", "skills");
const target = join(root, ".claude", "skills");

mkdirSync(target, { recursive: true });

for (const entry of readdirSync(source, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const link = join(target, entry.name);
  if (existsSync(link) || lstatSync(link, { throwIfNoEntry: false })) continue;
  symlinkSync(join(source, entry.name), link, "junction");
  console.log(`linked ${entry.name}`);
}
