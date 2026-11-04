// Guards the repository foundation (spec 001): workflow files, documentation hub, hooks, and ignore rules.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const lines = (path) =>
  read(path)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const SKILLS = [
  "breakdown-specs",
  "commit-and-push",
  "create-specification",
  "feature-concept",
  "find-skills",
  "frontend-design",
  "grill-me",
  "handoff",
  "implement-me",
  "implement-specs",
  "playwright",
  "refine-spec",
  "skill-creator",
  "tdd",
  "vercel-react-best-practices",
  "vitest",
  "web-design-guidelines",
];
const AGENTS = [
  "bug-investigator",
  "code-reviewer",
  "docs-keeper",
  "evolution-advisor",
  "performance-analyst",
  "structure-auditor",
];
const COMMANDS = [
  "analyze-performance",
  "audit-structure",
  "health-check",
  "investigate-bug",
  "plan-evolution",
  "sync-docs",
];
const DOCS = [
  "AGENTS",
  "ARCHITECTURE",
  "BUSINESS",
  "CONVENTIONS",
  "DESIGN",
  "DESIGN_SYSTEM",
  "DEVELOPMENT",
  "QA",
  "RULES",
];
const SECTIONS = [
  "Scope",
  "Context",
  "Business needs",
  "Acceptance Criteria",
  "What to do",
  "What not to do",
  "Result",
  "Open questions",
];

function filesUnder(directory, extension) {
  const found = [];
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path, extension));
    else if (path.endsWith(extension)) found.push(path);
  }
  return found;
}

test("root package is private, pins Yarn, and declares the tasks and tools", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.private, true);
  assert.match(pkg.packageManager, /^yarn@1\.\d+\.\d+$/);
  for (const script of [
    "code:fix",
    "lint",
    "types:check",
    "test",
    "test:e2e",
    "build",
    "skills:link",
    "prepare",
  ]) {
    assert.ok(pkg.scripts[script], `missing script ${script}`);
  }
  for (const tool of [
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "lefthook",
    "lint-staged",
    "oxlint",
    "oxfmt",
  ]) {
    assert.ok(pkg.devDependencies[tool], `missing dev dependency ${tool}`);
  }
});

test("commitlint extends Conventional Commits", () => {
  assert.match(read("commitlint.config.mjs"), /@commitlint\/config-conventional/);
});

test("Lefthook runs lint-staged before a commit and commitlint on the message", () => {
  const config = read("lefthook.yml");
  assert.match(config, /pre-commit:/);
  assert.match(config, /yarn lint-staged/);
  assert.match(config, /commit-msg:/);
  assert.match(config, /yarn commitlint --edit \{1\}/);
});

test("text files use LF line endings", () => {
  assert.ok(
    lines(".gitattributes").some((line) => /^\*\s+.*eol=lf/.test(line)),
    "missing '* ... eol=lf'",
  );
});

test("gitignore covers dependencies, build output, env files, links, and design exports", () => {
  const ignored = lines(".gitignore");
  for (const entry of [
    "node_modules",
    ".env.local",
    "build",
    "dist",
    ".gradle",
    ".claude/skills",
    "docs/design/*.fig",
    "docs/design/*.pdf",
    "docs/design/image-frames.png",
  ]) {
    assert.ok(ignored.includes(entry), `.gitignore is missing ${entry}`);
  }
  assert.ok(!ignored.includes("docs/design/figma-analysis.md"), "the analysis must stay tracked");
});

test("the 17 workflow skills exist with a SKILL.md named after their folder", () => {
  const folders = readdirSync(join(root, ".agents/skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
  assert.deepEqual(folders, SKILLS);
  for (const skill of SKILLS) {
    const text = read(`.agents/skills/${skill}/SKILL.md`);
    assert.match(
      text,
      new RegExp(`^---\\r?\\n(?:[\\s\\S]*?\\r?\\n)?name: ["']?${skill}["']?\\r?\\n`),
      `${skill} front matter`,
    );
  }
});

test("skills are linked once and linking twice is safe", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "link-skills-"));
  mkdirSync(join(sandbox, "scripts"));
  cpSync(join(root, "scripts/link-skills.mjs"), join(sandbox, "scripts/link-skills.mjs"));
  for (const skill of ["alpha", "beta"]) {
    mkdirSync(join(sandbox, ".agents/skills", skill), { recursive: true });
  }
  const run = () =>
    spawnSync(process.execPath, [join(sandbox, "scripts/link-skills.mjs")], { encoding: "utf8" });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  for (const skill of ["alpha", "beta"]) {
    assert.ok(
      lstatSync(join(sandbox, ".claude/skills", skill)).isSymbolicLink() ||
        existsSync(join(sandbox, ".claude/skills", skill)),
    );
  }
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout.trim(), "");
});

test("the six agents and six commands exist with front matter", () => {
  for (const agent of AGENTS) {
    const text = read(`.claude/agents/${agent}.md`);
    assert.match(text, new RegExp(`^---\\r?\\nname: ${agent}\\r?\\n`));
  }
  for (const command of COMMANDS) {
    const text = read(`.claude/commands/${command}.md`);
    assert.match(text, /^---\r?\ndescription: .+/);
  }
  const extra = readdirSync(join(root, ".claude/agents")).filter(
    (file) => !AGENTS.includes(file.replace(".md", "")),
  );
  assert.deepEqual(extra, []);
});

test("the documentation hub has the nine documents and the root entry point", () => {
  for (const doc of DOCS)
    assert.ok(existsSync(join(root, ".docs", `${doc}.md`)), `${doc}.md is missing`);
  assert.match(read("AGENTS.md"), /\.docs\/AGENTS\.md/);
});

test(".docs/AGENTS.md maps the other eight documents", () => {
  const agents = read(".docs/AGENTS.md");
  for (const doc of DOCS.filter((name) => name !== "AGENTS")) {
    assert.ok(agents.includes(`](${doc}.md)`), `${doc}.md is not linked in the document map`);
  }
});

test(".docs/AGENTS.md lists every skill, agent, and command", () => {
  const agents = read(".docs/AGENTS.md");
  for (const skill of [
    "create-specification",
    "breakdown-specs",
    "refine-spec",
    "feature-concept",
    "implement-me",
    "implement-specs",
    "commit-and-push",
  ]) {
    assert.ok(agents.includes(`\`${skill}\``), `skill ${skill} is not described`);
  }
  for (const agent of AGENTS)
    assert.ok(agents.includes(`\`${agent}\``), `agent ${agent} is not described`);
  for (const command of COMMANDS) {
    assert.ok(agents.includes(`/${command}`), `command /${command} is not described`);
  }
});

test("documents describe Coffee Delivery and not the mold's stack or product", () => {
  const forbidden =
    /\bnest\.?js\b|\bnestjs\b|next\.js|\bnextjs\b|supabase|weaviate|langchain|shadcn|turborepo|\bturbo\b|\bexperts?\b|\bmailpit\b/i;
  const targets = [
    "AGENTS.md",
    "README.md",
    ...DOCS.map((doc) => `.docs/${doc}.md`),
    ...filesUnder(".claude", ".md"),
  ];
  for (const file of targets) {
    const match = read(file).match(forbidden);
    assert.equal(match, null, `${file} mentions "${match?.[0]}"`);
  }
  assert.match(read(".docs/BUSINESS.md"), /Coffee Delivery/);
  assert.match(read(".docs/ARCHITECTURE.md"), /Spring Boot/);
});

test("the spec template has the eight sections in order", () => {
  const headings = [...read(".specs/_template.md").matchAll(/^## (.+)$/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(headings, SECTIONS);
});

test("plans and adrs folders exist", () => {
  assert.ok(existsSync(join(root, "plans")));
  assert.ok(existsSync(join(root, "adrs")));
});
