import type { createAuthClient } from "./clients/auth.client.js";
import type { createNotesClient } from "./clients/notes.client.js";

export type ReturnTypeOfAuthClient = ReturnType<typeof createAuthClient>;
export type ReturnTypeOfNotesClient = ReturnType<typeof createNotesClient>;
