// Checks that Postgres answers on its port, so `yarn test:e2e` fails at once with a clear message
// instead of waiting for an API that can never start. The port is POSTGRES_PORT of .env.local (or
// .env.example, or 5432), the one `yarn infra:up` publishes.
import { connect } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readEnvFile } from "./env-file.mjs";

const DEFAULT_PORT = 5432;

export function postgresPort(env) {
  const port = Number(env.POSTGRES_PORT);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT;
}

export function unreachableMessage(port) {
  return `Postgres is not reachable on localhost:${port}. Start it with "yarn infra:up" (Docker must be running) and run the tests again.`;
}

/** Resolves `{ ok: true }` when something accepts a connection on the port, else `{ ok: false, message }`. */
export function checkPostgres(port, timeoutMs = 2000) {
  return new Promise((resolvePromise) => {
    const socket = connect({ host: "127.0.0.1", port });
    const fail = () => {
      socket.destroy();
      resolvePromise({ ok: false, message: unreachableMessage(port) });
    };
    socket.setTimeout(timeoutMs, fail);
    socket.once("error", fail);
    socket.once("connect", () => {
      socket.destroy();
      resolvePromise({ ok: true });
    });
  });
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const env = {
    ...readEnvFile(join(root, ".env.example")),
    ...readEnvFile(join(root, ".env.local")),
  };
  const result = await checkPostgres(postgresPort(env));
  if (!result.ok) {
    console.error(result.message);
    return 1;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
