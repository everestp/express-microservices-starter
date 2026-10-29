import CircuitBreaker from "opossum";
import type { z } from "zod";

export class DownstreamError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DownstreamError";
  }
}

export interface ServiceClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  serviceToken?: () => Promise<string>;
}

export function createServiceClient(config: ServiceClientConfig) {
  const timeoutMs = config.timeoutMs ?? 2500;
  const retries = config.retries ?? 2;

  async function send(path: string, init: RequestInit): Promise<Response> {
    const method = (init.method ?? "GET").toUpperCase();
    const retryable = method === "GET" || method === "HEAD";
    let attempt = 0;
    while (true) {
      try {
        const response = await fetch(new URL(path, config.baseUrl), {
          ...init,
          headers: {
            ...config.headers,
            ...(config.serviceToken ? { "x-service-token": await config.serviceToken() } : {}),
            ...init.headers,
          },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (response.status < 500 || !retryable || attempt >= retries) return response;
      } catch (error) {
        if (!retryable || attempt >= retries) throw error;
      }
      attempt += 1;
    }
  }

  const breaker = new CircuitBreaker(send, {
    timeout: timeoutMs + 250,
    errorThresholdPercentage: 50,
    resetTimeout: 10_000,
    volumeThreshold: 5,
  });

  return {
    async request<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
      const response = (await breaker.fire(path, init)) as Response;
      if (!response.ok)
        throw new DownstreamError(
          `Downstream request failed (${response.status})`,
          response.status,
        );
      if (response.status === 204) return schema.parse(undefined);
      const parsed = schema.safeParse(await response.json());
      if (!parsed.success)
        throw new DownstreamError("Downstream response did not match its contract", 502);
      return parsed.data;
    },
    breaker,
  };
}
