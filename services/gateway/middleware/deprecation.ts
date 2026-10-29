import type { RequestHandler } from "express";

export function deprecation(
  sunsetDate: Date,
  successor?: string,
): RequestHandler {
  return (_request, response, next) => {
    response.setHeader("Deprecation", "true");
    response.setHeader("Sunset", sunsetDate.toUTCString());
    if (successor)
      response.setHeader("Link", `<${successor}>; rel="successor-version"`);
    next();
  };
}
