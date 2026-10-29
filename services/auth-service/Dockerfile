FROM node:22-alpine
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter "...auth-service" build
ENV NODE_ENV=production
EXPOSE 8081
CMD ["node", "services/auth-service/dist/main.js"]
