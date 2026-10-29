import { forEventType } from "./typed-handler.js";
import type { EventHandler } from "@starter/event-bus";

export function createUserRegisteredHandler(handle: EventHandler): EventHandler {
  return forEventType("user.registered.v1", handle);
}
