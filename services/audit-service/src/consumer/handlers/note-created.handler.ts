import { forEventType } from "./typed-handler.js";
import type { EventHandler } from "@starter/event-bus";

export function createNoteCreatedHandler(handle: EventHandler): EventHandler {
  return forEventType("note.created.v1", handle);
}
