import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

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
