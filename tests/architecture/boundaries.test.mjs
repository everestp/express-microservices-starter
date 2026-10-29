import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

const services = ["gateway", "auth-service", "notes-service", "audit-service"];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return entry.name.endsWith(".ts") ? [path] : [];
    }),
  );
  return nested.flat();
}

test("services do not import another service's source", async () => {
  const violations = [];
  for (const owner of services) {
    for (const file of await sourceFiles(join("services", owner))) {
      const text = await readFile(file, "utf8");
      for (const other of services.filter((service) => service !== owner)) {
        if (text.includes(`services/${other}/src`)) violations.push(`${file} imports ${other}`);
      }
    }
  }
  assert.deepEqual(violations, []);
});
