// Runs once after the servers are up. The config reuses a server that is already running, so this
// checks that the servers are the right ones: another project on port 5173, 4173, or 3000 must make the run
// fail with a clear message instead of testing the wrong app.
const APP_URL = "http://localhost:5173/";
const BUILD_URL = "http://localhost:4173/";
const API_HEALTH_URL = "http://localhost:3000/actuator/health";

async function read(url: string): Promise<{ status: number; body: string }> {
  try {
    const response = await fetch(url);
    return { status: response.status, body: await response.text() };
  } catch (error) {
    throw new Error(`${url} did not answer: ${(error as Error).message}`, { cause: error });
  }
}

/**
 * Read-only requests that make the servers warm, so readiness means "warm" and not "answers on the
 * port": the first tests of a run all load a page at the same moment, and a cold dev server or a cold
 * JVM can take longer than the 5 seconds of an expectation. Nothing here writes (no POST).
 */
export async function warmUp(): Promise<void> {
  const unknownOrder = "00000000-0000-4000-8000-000000000000";
  const urls = [
    "http://localhost:5173/",
    "http://localhost:5173/checkout",
    `http://localhost:5173/orders/${unknownOrder}`,
    "http://localhost:3000/api/v1/coffees",
    "http://localhost:3000/api/v1/coffees?tags=special,iced",
    "http://localhost:3000/api/v1/checkout-config",
    `http://localhost:3000/api/v1/orders/${unknownOrder}`,
  ];
  // Twice, so the second round finds the code the first one loaded.
  for (let round = 0; round < 2; round += 1) {
    await Promise.all(
      urls.map((url) =>
        fetch(url).then(
          (response) => response.arrayBuffer(),
          () => undefined,
        ),
      ),
    );
  }
}

export default async function globalSetup(): Promise<void> {
  const app = await read(APP_URL);
  if (app.status !== 200 || !app.body.includes("<title>Coffee Delivery</title>")) {
    throw new Error(
      "Port 5173 is serving something other than the Coffee Delivery app. Stop that server and run the tests again.",
    );
  }

  const build = await read(BUILD_URL);
  if (build.status !== 200 || !build.body.includes("<title>Coffee Delivery</title>")) {
    throw new Error(
      "Port 4173 is serving something other than the Coffee Delivery build. Stop that server and run the tests again.",
    );
  }

  const api = await read(API_HEALTH_URL);
  if (api.status !== 200 || !api.body.includes('"UP"')) {
    throw new Error(
      `The API on port 3000 is not healthy (status ${api.status}). Check the database with "yarn infra:up" and run the tests again.`,
    );
  }
  await warmUp();
}
