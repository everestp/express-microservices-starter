import { forEventType } from "./typed-handler.js";
import type { EventHandler } from "@starter/event-bus";

export function createNoteUpdatedHandler(handle: EventHandler): EventHandler {
  return forEventType("note.updated.v1", handle);
}
