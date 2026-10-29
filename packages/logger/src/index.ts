import pino, { type Logger, type LoggerOptions } from "pino";

export function createLogger(
  serviceName: string,
  level = process.env.LOG_LEVEL ?? "info",
): Logger {
  const options: LoggerOptions = {
    level,
    base: { service: serviceName },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "passwordHash",
        "refreshToken",
        "*.password",
        "*.refreshToken",
      ],
      censor: "[REDACTED]",
    },
  };
  return pino(options);
}
