// Creates .env.local from .env.example for local development. An existing .env.local is never overwritten.
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function ensureEnvLocal(root) {
  const example = join(root, ".env.example");
  const local = join(root, ".env.local");
  if (existsSync(local)) return { status: "kept", path: local };
  if (!existsSync(example)) {
    throw new Error(`Cannot create .env.local: ${example} does not exist.`);
  }
  copyFileSync(example, local);
  return { status: "created", path: local };
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    const { status } = ensureEnvLocal(root);
    console.log(
      status === "created"
        ? "Created .env.local from .env.example."
        : ".env.local already exists; left unchanged.",
    );
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
