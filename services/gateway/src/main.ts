import { loadConfig } from "@starter/config-kit";
import { listen } from "@starter/http-kit";
import { createGatewayApp } from "./app.js";
import { createGatewayContainer } from "./container.js";
import { gatewayEnvSchema } from "../config/env.js";

const config = loadConfig(gatewayEnvSchema);
const container = createGatewayContainer(config);
const app = createGatewayApp(config, container);

listen(app, config.GATEWAY_PORT, "gateway");
