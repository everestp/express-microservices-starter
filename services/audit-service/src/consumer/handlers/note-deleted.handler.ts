import { forEventType } from "./typed-handler.js";
import type { EventHandler } from "@starter/event-bus";

export function createNoteDeletedHandler(handle: EventHandler): EventHandler {
  return forEventType("note.deleted.v1", handle);
}
