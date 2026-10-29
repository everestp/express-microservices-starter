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

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type Problem = z.infer<typeof problemSchema>;