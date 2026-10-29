import { ConflictError, NotFoundError } from "@starter/errors";
import type { NoteCreate, NoteUpdate } from "@starter/contracts";
import type { NotesRepository } from "../domain/notes.port.js";

export class NotesService {
  constructor(private readonly notes: NotesRepository) {}

  list(
    ownerId: string,
    limit: number,
    cursor: Parameters<NotesRepository["list"]>[2],
  ) {
    return this.notes.list(ownerId, limit, cursor);
  }

  async get(ownerId: string, id: string) {
    const note = await this.notes.get(ownerId, id);
    if (!note) throw new NotFoundError("Note was not found");
    return note;
  }

  create(ownerId: string, input: NoteCreate) {
    return this.notes.create(ownerId, input);
  }

  async update(ownerId: string, id: string, input: NoteUpdate) {
    const note = await this.notes.update(ownerId, id, input);
    if (!note) throw new ConflictError("Note is missing or has changed");
    return note;
  }

  async remove(ownerId: string, id: string, version: number) {
    if (!(await this.notes.remove(ownerId, id, version))) {
      throw new ConflictError("Note is missing or has changed");
    }
  }
}
