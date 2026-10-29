import type { NoteCreate, NoteUpdate } from "@starter/contracts";
import type { Note, NoteCursor } from "./note.js";

export interface NotesRepository {
  list(
    ownerId: string,
    limit: number,
    cursor: NoteCursor | null,
  ): Promise<{
    items: Note[];
    nextCursor: string | null;
  }>;
  get(ownerId: string, id: string): Promise<Note | null>;
  create(ownerId: string, input: NoteCreate): Promise<Note>;
  update(ownerId: string, id: string, input: NoteUpdate): Promise<Note | null>;
  remove(ownerId: string, id: string, version: number): Promise<boolean>;
}
