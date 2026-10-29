export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request is invalid") {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource was not found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "The resource has changed") {
    super(message, "CONFLICT", 409);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "The service is temporarily unavailable") {
    super(message, "SERVICE_UNAVAILABLE", 503);
  }
}
