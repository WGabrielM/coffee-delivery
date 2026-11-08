// Runs once after the servers are up. The config reuses a server that is already running, so this
// checks that the servers are the right ones: another project on port 5173 or 3000 must make the run
// fail with a clear message instead of testing the wrong app.
const APP_URL = "http://localhost:5173/";
const API_HEALTH_URL = "http://localhost:3000/actuator/health";

async function read(url: string): Promise<{ status: number; body: string }> {
  try {
    const response = await fetch(url);
    return { status: response.status, body: await response.text() };
  } catch (error) {
    throw new Error(`${url} did not answer: ${(error as Error).message}`, { cause: error });
  }
}

export default async function globalSetup(): Promise<void> {
  const app = await read(APP_URL);
  if (app.status !== 200 || !app.body.includes("<title>Coffee Delivery</title>")) {
    throw new Error(
      "Port 5173 is serving something other than the Coffee Delivery app. Stop that server and run the tests again.",
    );
  }

  const api = await read(API_HEALTH_URL);
  if (api.status !== 200 || !api.body.includes('"UP"')) {
    throw new Error(
      `The API on port 3000 is not healthy (status ${api.status}). Check the database with "yarn infra:up" and run the tests again.`,
    );
  }
}
