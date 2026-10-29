import net from "node:net";

const [host, rawPort, rawTimeout] = process.argv.slice(2);
const port = Number(rawPort);
const timeoutMs = Number(rawTimeout ?? 30_000);
if (!host || !Number.isInteger(port) || port < 1) {
  throw new Error("Usage: node scripts/wait-for.mjs <host> <port> [timeout-ms]");
}

const deadline = Date.now() + timeoutMs;
while (Date.now() < deadline) {
  const connected = await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
  if (connected) process.exit(0);
  await new Promise((resolve) => setTimeout(resolve, 500));
}
throw new Error(`Timed out waiting for ${host}:${port}`);
