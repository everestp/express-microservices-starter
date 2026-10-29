import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const spec = {
  openapi: "3.1.0",
  info: { title: "Express Microservices API", version: "1.0.0" },
  servers: [{ url: "http://localhost:8080" }],
  paths: {
    "/api/v1/auth/register": { post: { operationId: "register" } },
    "/api/v1/auth/login": { post: { operationId: "login" } },
    "/api/v1/auth/refresh": { post: { operationId: "refresh" } },
    "/api/v1/notes": { get: { operationId: "listNotes" }, post: { operationId: "createNote" } },
    "/api/v1/notes/{noteId}": {
      get: { operationId: "getNote" },
      put: { operationId: "updateNote" },
      delete: { operationId: "deleteNote" },
    },
  },
};

const outputDirectory = resolve("openapi");
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "openapi.json"), `${JSON.stringify(spec, null, 2)}\n`);
