import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMigration } from "../dist/index.js";

test("parses reversible SQL sections", () => {
  const sections = parseMigration(
    `-- migrate:up\nCREATE TABLE notes (id uuid);\n-- migrate:down\nDROP TABLE notes;`,
  );

  assert.match(sections.up, /CREATE TABLE notes/);
  assert.match(sections.down, /DROP TABLE notes/);
});

test("rejects migrations without both directions", () => {
  assert.throws(
    () => parseMigration("-- migrate:up\nSELECT 1;"),
    /non-empty migrate:up and migrate:down/,
  );
});
