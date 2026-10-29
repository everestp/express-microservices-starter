export interface Note {
  id: string;
  ownerUserId: string;
  title: string;
  content: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteCursor {
  createdAt: string;
  id: string;
}
