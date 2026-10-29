import assert from "node:assert/strict";
import { test } from "node:test";
import {
  noteCreateSchema,
  noteUpdateSchema,
  registerRequestSchema,
} from "../dist/index.js";

test("registration normalizes email and enforces a strong password length", () => {
  const result = registerRequestSchema.safeParse({
    email: "  USER@Example.com ",
    password: "a-long-enough-password",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.email, "user@example.com");
  assert.equal(
    registerRequestSchema.safeParse({
      email: "user@example.com",
      password: "short",
    }).success,
    false,
  );
});

test("note schemas apply defaults and require a positive optimistic version", () => {
  assert.deepEqual(noteCreateSchema.parse({ title: "  title " }), {
    title: "title",
    content: "",
  });
  assert.equal(
    noteUpdateSchema.safeParse({ title: "title", content: "", version: 0 })
      .success,
    false,
  );
});
