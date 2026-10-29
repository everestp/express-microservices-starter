import { createServiceApp, listen } from "@starter/http-kit";

const app = createServiceApp("gateway");
const authUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:8081";
const notesUrl = process.env.NOTES_SERVICE_URL ?? "http://localhost:8082";
const auditUrl = process.env.AUDIT_SERVICE_URL ?? "http://localhost:8083";

app.get("/api/v1/health", async (_request, response) => {
  const checks = await Promise.all(
    [authUrl, notesUrl, auditUrl].map(async (url) => {
      try {
        const result = await fetch(`${url}/healthz`, { signal: AbortSignal.timeout(1500) });
        return result.ok;
      } catch {
        return false;
      }
    }),
  );
  response.status(checks.every(Boolean) ? 200 : 503).json({
    status: checks.every(Boolean) ? "ok" : "degraded",
    dependencies: { auth: checks[0], notes: checks[1], audit: checks[2] },
  });
});

listen(app, Number(process.env.GATEWAY_PORT ?? 8080), "gateway");