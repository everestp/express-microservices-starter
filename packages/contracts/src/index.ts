import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
});

export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  request_id: z.string().optional(),
});

export const registerRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
});

export const loginRequestSchema = registerRequestSchema;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(40).max(200),
});

export const tokenPairSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string(),
  refreshExpiresIn: z.number().int().positive(),
});

export const registerResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export const auditEventListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      eventId: z.string().uuid(),
      actorId: z.string().uuid(),
      action: z.string(),
      resourceType: z.string(),
      resourceId: z.string().uuid(),
      occurredAt: z.string().datetime(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export const noteCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(100_000).default(""),
});

export const noteUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(100_000),
  version: z.number().int().positive(),
});

export const noteDeleteSchema = z.object({
  version: z.number().int().positive(),
});

export const noteSchema = z.object({
  id: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const noteListSchema = z.object({
  items: z.array(noteSchema),
  nextCursor: z.string().nullable(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type Problem = z.infer<typeof problemSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;
export type NoteCreate = z.infer<typeof noteCreateSchema>;
export type NoteUpdate = z.infer<typeof noteUpdateSchema>;
export type Note = z.infer<typeof noteSchema>;
export type NoteList = z.infer<typeof noteListSchema>;
