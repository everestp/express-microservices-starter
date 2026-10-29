import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { collectDefaultMetrics, Histogram, Registry } from "prom-client";

export function startTelemetry(serviceName: string): NodeSDK {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const sdk = new NodeSDK({
    resource: new Resource({ [ATTR_SERVICE_NAME]: serviceName }),
    ...(endpoint
      ? {
          traceExporter: new OTLPTraceExporter({
            url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
          }),
        }
      : {}),
  });
  sdk.start();
  return sdk;
}

export function createMetrics(serviceName: string) {
  const registry = new Registry();
  registry.setDefaultLabels({ service: serviceName });
  collectDefaultMetrics({ register: registry });
  const requestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"] as const,
    registers: [registry],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  });
  return {
    registry,
    observeRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
      requestDuration.observe({ method, route, status_code: String(statusCode) }, durationSeconds);
    },
  };
}
