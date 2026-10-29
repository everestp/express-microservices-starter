import {
  noteCreateSchema,
  noteDeleteSchema,
  noteUpdateSchema,
} from "@starter/contracts";
import {
  createServiceApp,
  HttpError,
  installErrorHandlers,
  listen,
} from "@starter/http-kit";
import { createAccessTokenMiddleware } from "@starter/service-auth";
import { createNotesRepository, decodeCursor } from "./notes.repository.js";

const serviceName = "notes-service";
const databaseUrl = process.env.NOTES_DATABASE_URL;
const jwksUrl =
  process.env.AUTH_JWKS_URL ?? "http://localhost:8081/.well-known/jwks.json";
if (!databaseUrl) throw new Error("NOTES_DATABASE_URL must be configured");

const repository = createNotesRepository(databaseUrl);
const app = createServiceApp(serviceName);
const authenticate = createAccessTokenMiddleware(jwksUrl);

app.get("/readyz", async (_request, response) => {
  try {
    await repository.pool.query("SELECT 1");
    response.json({
      status: "ok",
      service: serviceName,
      dependencies: { database: "ok" },
    });
  } catch {
    response
      .status(503)
      .json({
        status: "unavailable",
        dependencies: { database: "unavailable" },
      });
  }
});

app.use("/internal/v1/notes", authenticate);

app.get("/internal/v1/notes", async (request, response) => {
  const rawLimit = request.query.limit;
  const limit =
    rawLimit === undefined
      ? 20
      : typeof rawLimit === "string"
        ? Number(rawLimit)
        : NaN;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, "limit must be an integer from 1 to 100");
  }
  const rawCursor = request.query.cursor;
  if (rawCursor !== undefined && typeof rawCursor !== "string") {
    throw new HttpError(400, "cursor is invalid");
  }
  const cursor = rawCursor === undefined ? null : decodeCursor(rawCursor);
  if (rawCursor !== undefined && !cursor)
    throw new HttpError(400, "cursor is invalid");
  const page = await repository.list(response.locals.userId, limit, cursor);
  response.json({
    items: page.items.map((note) => ({
      id: note.id,
      ownerUserId: note.owner_user_id,
      title: note.title,
      content: note.content,
      version: note.version,
      createdAt: note.created_at.toISOString(),
      updatedAt: note.updated_at.toISOString(),
    })),
    nextCursor: page.nextCursor,
  });
});

app.post("/internal/v1/notes", async (request, response) => {
  const parsed = noteCreateSchema.safeParse(request.body);
  if (!parsed.success) throw new HttpError(400, "Note details are invalid");
  const note = await repository.create(response.locals.userId, parsed.data);
  response.status(201).json({
    id: note.id,
    ownerUserId: note.owner_user_id,
    title: note.title,
    content: note.content,
    version: note.version,
    createdAt: note.created_at.toISOString(),
    updatedAt: note.updated_at.toISOString(),
  });
});

app.get("/internal/v1/notes/:noteId", async (request, response) => {
  const parsedId = noteId(request.params.noteId);
  const note = await repository.get(response.locals.userId, parsedId);
  if (!note) throw new HttpError(404, "Note was not found");
  response.json({
    id: note.id,
    ownerUserId: note.owner_user_id,
    title: note.title,
    content: note.content,
    version: note.version,
    createdAt: note.created_at.toISOString(),
    updatedAt: note.updated_at.toISOString(),
  });
});

app.put("/internal/v1/notes/:noteId", async (request, response) => {
  const parsedBody = noteUpdateSchema.safeParse(request.body);
  if (!parsedBody.success) throw new HttpError(400, "Note details are invalid");
  const result = await repository.update(
    response.locals.userId,
    noteId(request.params.noteId),
    parsedBody.data,
  );
  if (result.kind === "missing") throw new HttpError(404, "Note was not found");
  if (result.kind === "conflict")
    throw new HttpError(409, "Note was changed by another request");
  const note = result.note;
  response.json({
    id: note.id,
    ownerUserId: note.owner_user_id,
    title: note.title,
    content: note.content,
    version: note.version,
    createdAt: note.created_at.toISOString(),
    updatedAt: note.updated_at.toISOString(),
  });
});

app.delete("/internal/v1/notes/:noteId", async (request, response) => {
  const parsedBody = noteDeleteSchema.safeParse(request.body);
  if (!parsedBody.success)
    throw new HttpError(400, "A note version is required");
  const result = await repository.remove(
    response.locals.userId,
    noteId(request.params.noteId),
    parsedBody.data.version,
  );
  if (result === "missing") throw new HttpError(404, "Note was not found");
  if (result === "conflict")
    throw new HttpError(409, "Note was changed by another request");
  response.status(204).end();
});

function noteId(value: string): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new HttpError(400, "Note ID is invalid");
  }
  return value;
}

installErrorHandlers(app);
const server = listen(
  app,
  Number(process.env.NOTES_SERVICE_PORT ?? 8082),
  serviceName,
);
const shutdown = () => server.close(() => void repository.pool.end());
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
