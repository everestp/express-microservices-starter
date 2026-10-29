import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServiceApp } from "../dist/index.js";

let server;
let baseUrl;

before(async () => {
  server = createServiceApp("test-service").listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health response identifies the service", async () => {
  const response = await fetch(`${baseUrl}/healthz`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "test-service",
  });
});

test("request IDs are returned and preserved", async () => {
  const response = await fetch(`${baseUrl}/healthz`, {
    headers: { "x-request-id": "request-test-123" },
  });

  assert.equal(response.headers.get("x-request-id"), "request-test-123");
});