import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { eventEnvelopeSchema } from "../../packages/event-bus/dist/index.js";

test("user-registered event fixture matches the shared envelope", async () => {
  const source = await readFile("tests/contract/fixtures/user-registered.v1.json", "utf8");
  const event = JSON.parse(source);
  assert.equal(eventEnvelopeSchema.safeParse(event).success, true);
});
