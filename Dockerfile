# AssignAI production image: one container serves the app and runs the background job worker.
# All data (including uploaded ZIPs) lives in PostgreSQL: pass DATABASE_URL at runtime. No disk is needed.
FROM node:22-bookworm-slim

# openssl: needed by Prisma's migration engine. ca-certificates: outbound HTTPS to the AI API and the database.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies first for better layer caching (postinstall runs `prisma generate`).
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
# Some hosts (e.g. Hugging Face Spaces) run the container as a non-root user: let it write Next's cache.
RUN npm run build && chmod -R a+rwX /app/.next

ENV NODE_ENV=production \
    PORT=3000 \
    HOME=/tmp \
    CHECKPOINT_DISABLE=1
EXPOSE 3000

CMD ["sh", "scripts/docker-start.sh"]
