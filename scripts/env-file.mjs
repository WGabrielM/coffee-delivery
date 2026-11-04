// Reads a dotenv-style file (KEY=VALUE per line, # comments, optional quotes) into an object.
import { existsSync, readFileSync } from "node:fs";

export function parseEnvFile(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

export function readEnvFile(path) {
  return existsSync(path) ? parseEnvFile(readFileSync(path, "utf8")) : {};
}
