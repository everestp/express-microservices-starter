import { DownstreamError } from "@starter/service-client";
import { HttpError } from "@starter/http-kit";

export function mapDownstreamError(error: unknown): HttpError {
  if (!(error instanceof DownstreamError)) {
    return new HttpError(
      503,
      "A downstream service is temporarily unavailable",
    );
  }
  if (error.status === 404) return new HttpError(404, "Resource was not found");
  if (error.status === 409)
    return new HttpError(409, "The request conflicts with current state");
  if (error.status === 400 || error.status === 401 || error.status === 403) {
    return new HttpError(
      error.status,
      "The downstream service rejected the request",
    );
  }
  return new HttpError(503, "A downstream service is temporarily unavailable");
}
