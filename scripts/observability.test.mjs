// Guards the Grafana dashboard as code and its provisioning (spec 008).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const DASHBOARD = "infra/grafana/dashboards/coffee-delivery-api.json";
const PROVIDER = "infra/grafana/provisioning/dashboards/coffee-delivery.yaml";

const dashboard = () => JSON.parse(read(DASHBOARD));
const panels = () => dashboard().panels.filter((panel) => panel.type !== "row");

test("the dashboard file is valid JSON named Coffee Delivery API", () => {
  const json = dashboard();
  assert.equal(json.title, "Coffee Delivery API");
  assert.equal(json.uid, "coffee-delivery-api");
  assert.ok(Array.isArray(json.panels) && json.panels.length > 0);
});

test("the dashboard has the panels the spec asks for", () => {
  const titles = panels().map((panel) => panel.title);
  for (const title of [
    "Request rate by route",
    "Error rate (5xx)",
    "Latency p50 by route",
    "Latency p95 by route",
    "Latency p99 by route",
    "JVM heap",
    "Database connection pool",
  ]) {
    assert.ok(titles.includes(title), `missing panel: ${title}`);
  }
});

test("every panel reads the provisioned Prometheus datasource and has a query", () => {
  for (const panel of panels()) {
    assert.equal(panel.datasource?.uid, "prometheus", `${panel.title}: datasource`);
    assert.ok(panel.targets?.length > 0, `${panel.title}: no targets`);
    for (const target of panel.targets) {
      assert.ok(target.expr?.trim(), `${panel.title}: empty expression`);
      assert.equal(target.datasource?.uid, "prometheus", `${panel.title}: target datasource`);
    }
  }
});

test("queries use the metric names the API exports (milliseconds, not seconds)", () => {
  const expressions = panels().flatMap((panel) => panel.targets.map((target) => target.expr));
  const joined = expressions.join("\n");
  assert.match(joined, /http_server_requests_milliseconds_count/);
  assert.match(joined, /http_server_requests_milliseconds_bucket/);
  assert.match(joined, /jvm_memory_used_bytes\{[^}]*area="heap"/);
  assert.match(joined, /hikaricp_connections_active/);
  assert.doesNotMatch(joined, /http_server_requests_seconds/);
});

test("the latency panels are quantiles of the request histogram by route at 0.5, 0.95, and 0.99", () => {
  for (const [title, quantile] of [
    ["Latency p50 by route", "0.5"],
    ["Latency p95 by route", "0.95"],
    ["Latency p99 by route", "0.99"],
  ]) {
    const panel = panels().find((candidate) => candidate.title === title);
    assert.ok(panel, title);
    const expr = panel.targets[0].expr;
    assert.match(expr, new RegExp(`histogram_quantile\\(${quantile.replace(".", "\\.")},`));
    assert.match(expr, /sum by \(le, uri\)/);
    assert.equal(panel.fieldConfig?.defaults?.unit, "ms");
  }
});

test("the error rate panel counts 5xx responses", () => {
  const panel = panels().find((candidate) => candidate.title === "Error rate (5xx)");
  assert.match(panel.targets[0].expr, /status=~"5\.\."/);
});

test("the provider loads the dashboards folder and does not accept UI edits", () => {
  assert.ok(existsSync(join(root, PROVIDER)), "provider file missing");
  const provider = read(PROVIDER);
  assert.match(provider, /apiVersion: 1/);
  assert.match(provider, /path: \/otel-lgtm\/coffee-delivery-dashboards/);
  assert.match(provider, /allowUiUpdates: false/);
});

test("compose mounts the provider and the dashboards read only into the Grafana service", () => {
  const compose = read("compose.yaml");
  const grafana = compose.slice(compose.indexOf("  grafana:"), compose.indexOf("\nvolumes:"));
  assert.ok(
    grafana.includes(
      "./infra/grafana/provisioning/dashboards/coffee-delivery.yaml:/otel-lgtm/grafana/conf/provisioning/dashboards/coffee-delivery.yaml:ro",
    ),
    "provider mount missing",
  );
  assert.ok(
    grafana.includes("./infra/grafana/dashboards:/otel-lgtm/coffee-delivery-dashboards:ro"),
    "dashboards mount missing",
  );
});
