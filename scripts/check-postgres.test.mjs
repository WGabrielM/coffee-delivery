// Guards the Postgres check that `yarn test:e2e` runs before it starts anything (spec 028).
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { test } from "node:test";

import { checkPostgres, postgresPort, unreachableMessage } from "./check-postgres.mjs";

test("postgresPort reads POSTGRES_PORT from the env file and falls back to 5432", () => {
  assert.equal(postgresPort({ POSTGRES_PORT: "5544" }), 5544);
  assert.equal(postgresPort({}), 5432);
  assert.equal(postgresPort({ POSTGRES_PORT: "not a port" }), 5432);
  assert.equal(postgresPort({ POSTGRES_PORT: "70000" }), 5432);
});

test("the message names the port and says how to start the database", () => {
  const message = unreachableMessage(5544);
  assert.match(message, /Postgres is not reachable on localhost:5544/);
  assert.match(message, /yarn infra:up/);
});

test("checkPostgres is ok when something listens on the port", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    assert.deepEqual(await checkPostgres(port), { ok: true });
  } finally {
    server.close();
  }
});

test("checkPostgres fails with the clear message when nothing listens on the port", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));

  const result = await checkPostgres(port, 500);

  assert.equal(result.ok, false);
  assert.equal(result.message, unreachableMessage(port));
});
