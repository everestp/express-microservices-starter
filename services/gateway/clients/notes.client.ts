import {
  noteCreateSchema,
  noteDeleteSchema,
  noteListSchema,
  noteSchema,
  noteUpdateSchema,
} from "@starter/contracts";
import { createServiceClient } from "@starter/service-client";
import { z } from "zod";

export function createNotesClient(baseUrl: string, serviceToken: () => Promise<string>) {
  const client = createServiceClient({ baseUrl, serviceToken });
  function headers(token: string, requestId: string): HeadersInit {
    return { authorization: token, "x-request-id": requestId };
  }
  return {
    list: (token: string, requestId: string, query = "") =>
      client.request(
        `/internal/v1/notes${query}`,
        { headers: headers(token, requestId) },
        noteListSchema,
      ),
    get: (id: string, token: string, requestId: string) =>
      client.request(
        `/internal/v1/notes/${encodeURIComponent(id)}`,
        { headers: headers(token, requestId) },
        noteSchema,
      ),
    create: (body: unknown, token: string, requestId: string) =>
      client.request(
        "/internal/v1/notes",
        {
          method: "POST",
          headers: {
            ...headers(token, requestId),
            "content-type": "application/json",
          },
          body: JSON.stringify(noteCreateSchema.parse(body)),
        },
        noteSchema,
      ),
    update: (id: string, body: unknown, token: string, requestId: string) =>
      client.request(
        `/internal/v1/notes/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: {
            ...headers(token, requestId),
            "content-type": "application/json",
          },
          body: JSON.stringify(noteUpdateSchema.parse(body)),
        },
        noteSchema,
      ),
    remove: (id: string, body: unknown, token: string, requestId: string) =>
      client.request(
        `/internal/v1/notes/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            ...headers(token, requestId),
            "content-type": "application/json",
          },
          body: JSON.stringify(noteDeleteSchema.parse(body)),
        },
        z.void(),
      ),
  };
}
