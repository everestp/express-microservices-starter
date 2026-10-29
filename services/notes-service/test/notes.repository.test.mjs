import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeCursor, encodeCursor } from "../dist/notes.repository.js";

test("cursor round trips a timestamp and UUID", () => {
  const cursor = {
    createdAt: "2026-10-29T12:00:00.000Z",
    id: "a4ccf589-24e3-48c8-8876-cb134c1080c9",
  };
  assert.deepEqual(decodeCursor(encodeCursor(cursor)), cursor);
});

test("cursor decoder rejects malformed or tampered values", () => {
  assert.equal(decodeCursor("not-a-cursor"), null);
  const invalidCursor = Buffer.from(
    JSON.stringify({ createdAt: "yesterday", id: "note-1" }),
  ).toString("base64url");
  assert.equal(decodeCursor(invalidCursor), null);
});
