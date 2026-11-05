import { expect, test } from "@playwright/test";

const colors: Record<string, string> = {
  white: "#FFFFFF",
  background: "#FAFAFA",
  card: "#F3F2F2",
  input: "#EDEDED",
  button: "#E6E5E5",
  hover: "#D7D5D5",
  label: "#8D8686",
  text: "#574F4D",
  subtitle: "#403937",
  title: "#272221",
  "purple-light": "#EBE5F9",
  purple: "#8047F8",
  "purple-dark": "#4B2995",
  "yellow-light": "#F1E9C9",
  yellow: "#DBAC2C",
  "yellow-dark": "#C47F17",
  "hero-blob": "#EBC136",
  error: "#CC2937",
};

function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

test("the page has the background and the text color of the design", async ({ page }) => {
  await page.goto("/");

  const styles = await page.evaluate(() => {
    const computed = getComputedStyle(document.body);
    return { background: computed.backgroundColor, color: computed.color };
  });

  expect(styles.background).toBe("rgb(250, 250, 250)");
  expect(styles.color).toBe("rgb(87, 79, 77)");
});

test("every design color resolves to its exact value in the browser", async ({ page }) => {
  await page.goto("/");

  const resolved = await page.evaluate((names) => {
    const probe = document.createElement("div");
    document.body.append(probe);
    const result: Record<string, string> = {};
    for (const name of names) {
      probe.style.color = `var(--color-${name})`;
      result[name] = getComputedStyle(probe).color;
    }
    probe.remove();
    return result;
  }, Object.keys(colors));

  for (const [name, hex] of Object.entries(colors)) {
    expect(resolved[name], name).toBe(rgb(hex));
  }
});

test("Roboto 400/700 and Baloo 2 700/800 load from the app, never from a font host", async ({
  page,
}) => {
  const requests: { url: string; type: string }[] = [];
  page.on("request", (request) => {
    requests.push({ url: request.url(), type: request.resourceType() });
  });

  await page.goto("/");
  const loaded = await page.evaluate(async () => {
    const faces = [
      "400 16px Roboto",
      "700 16px Roboto",
      "700 16px 'Baloo 2'",
      "800 16px 'Baloo 2'",
    ];
    await Promise.all(faces.map((face) => document.fonts.load(face)));
    return faces.map((face) => document.fonts.check(face));
  });

  expect(loaded).toEqual([true, true, true, true]);
  const origin = new URL(page.url()).origin;
  const fonts = requests.filter((request) => request.type === "font");
  expect(fonts.length).toBeGreaterThanOrEqual(4);
  for (const request of requests.filter((candidate) => !candidate.url.startsWith("data:"))) {
    expect(request.url.startsWith(origin), request.url).toBe(true);
  }
});
