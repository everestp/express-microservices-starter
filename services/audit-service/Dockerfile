FROM node:22-alpine
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter "...audit-service" build
ENV NODE_ENV=production
EXPOSE 8083
CMD ["node", "services/audit-service/dist/main.js"]
