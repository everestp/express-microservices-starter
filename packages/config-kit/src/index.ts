import { z } from "zod";

export function loadConfig<T extends z.ZodType>(
  schema: T,
  source = process.env,
): z.infer<T> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(
      `Invalid environment configuration:\n${details.join("\n")}`,
    );
  }
  return parsed.data;
}

export function redactConfig<T extends Record<string, unknown>>(
  config: T,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      /secret|password|token|private.?key|database.?url/i.test(key)
        ? "[REDACTED]"
        : value,
    ]),
  );
}
