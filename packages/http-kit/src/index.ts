import { randomUUID } from "node:crypto";
import express, { type ErrorRequestHandler, type Express } from "express";

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
  app.use(((error, request, response, _next) => {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 500;
    response.status(status >= 400 && status < 600 ? status : 500).type("application/problem+json").json({
      type: "about:blank",
      title: status >= 500 ? "Internal Server Error" : "Bad Request",
      status: status >= 400 && status < 600 ? status : 500,
      request_id: response.locals.requestId ?? request.header("x-request-id"),
    });
  }) satisfies ErrorRequestHandler);
  return app;
}

export function listen(app: Express, port: number, serviceName: string): void {
  app.listen(port, "0.0.0.0", () => {
    console.info(`${serviceName} listening on ${port}`);
  });
}