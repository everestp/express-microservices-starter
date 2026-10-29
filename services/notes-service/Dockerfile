FROM node:22-alpine
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter "...notes-service" build
ENV NODE_ENV=production
EXPOSE 8082
CMD ["node", "services/notes-service/dist/main.js"]
