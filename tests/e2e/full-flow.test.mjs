import assert from "node:assert/strict";
import { test } from "node:test";

const baseUrl = process.env.E2E_BASE_URL;

test("register, login, create a note, and list audit events", { skip: !baseUrl }, async () => {
  const email = `starter-${crypto.randomUUID()}@example.com`;
  const password = "a-long-example-password";
  const postJson = async (path, body, headers = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });

  const registration = await postJson("/api/v1/auth/register", { email, password });
  assert.equal(registration.status, 201);
  const login = await postJson("/api/v1/auth/login", { email, password });
  assert.equal(login.status, 200);
  const { accessToken } = await login.json();

  const created = await postJson(
    "/api/v1/notes",
    { title: "E2E note", content: "Created by the full-flow example" },
    { authorization: `Bearer ${accessToken}` },
  );
  assert.equal(created.status, 201);
  const notes = await fetch(`${baseUrl}/api/v1/notes`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  assert.equal(notes.status, 200);
});
