FROM node:22-alpine
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter "...gateway" build
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "services/gateway/dist/main.js"]
