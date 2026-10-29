export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Express Microservices API",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/v1/auth/register": { post: { operationId: "register" } },
    "/api/v1/auth/login": { post: { operationId: "login" } },
    "/api/v1/notes": {
      get: { operationId: "listNotes" },
      post: { operationId: "createNote" },
    },
    "/api/v1/notes/{noteId}": {
      get: { operationId: "getNote" },
      put: { operationId: "updateNote" },
      delete: { operationId: "deleteNote" },
    },
  },
} as const;
