import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import express, { type ErrorRequestHandler, type Express, type RequestHandler } from "express";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function createInMemoryRateLimit(options: {
  limit: number;
  windowMs: number;
}): RequestHandler {
  const windows = new Map<string, { startedAt: number; count: number }>();
  return (request, _response, next) => {
    const now = Date.now();
    const key = request.ip;
    const current = windows.get(key);
    if (!current || now - current.startedAt >= options.windowMs) {
      windows.set(key, { startedAt: now, count: 1 });
      next();
      return;
    }
    current.count += 1;
    if (current.count > options.limit) {
      next(new HttpError(429, "Request rate limit exceeded"));
      return;
    }
    next();
  };
}

export function createServiceApp(serviceName: string): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    response.setHeader("x-request-id", requestId);
    response.locals.requestId = requestId;
    next();
  });
  app.get("/healthz", (_request, response) => {
    response.json({ status: "ok", service: serviceName });
  });
  return app;
}

export function installErrorHandlers(app: Express): void {
  app.use((_request, response) => {
    response.status(404).type("application/problem+json").json({
      type: "about:blank",
      title: "Not Found",
      status: 404,
      request_id: response.locals.requestId,
    });
  });

  app.use(((error: unknown, request, response, _next) => {
    const candidateStatus =
      error instanceof HttpError
        ? error.status
        : typeof error === "object" && error !== null && "status" in error
          ? Number(error.status)
          : 500;
    const status = candidateStatus >= 400 && candidateStatus < 600 ? candidateStatus : 500;
    const title =
      status === 400
        ? "Bad Request"
        : status === 401
          ? "Unauthorized"
          : status === 403
            ? "Forbidden"
            : status === 404
              ? "Not Found"
              : status === 409
                ? "Conflict"
                : status === 503
                  ? "Service Unavailable"
                  : "Internal Server Error";

    response
      .status(status)
      .type("application/problem+json")
      .json({
        type: "about:blank",
        title,
        status,
        ...(error instanceof HttpError ? { detail: error.message } : {}),
        request_id: response.locals.requestId ?? request.header("x-request-id"),
      });
  }) satisfies ErrorRequestHandler);
}

export function listen(app: Express, port: number, serviceName: string): Server {
  return app.listen(port, "0.0.0.0", () => {
    console.info(`${serviceName} listening on ${port}`);
  });
}
