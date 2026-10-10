# AssignAI production image: one container serves the app and runs the background job worker.
# Data (SQLite database + uploaded files) lives in /data. Mount a persistent volume there.
FROM node:22-bookworm-slim

# openssl: needed by Prisma's migration engine. ca-certificates: outbound HTTPS to the Claude API.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies first for better layer caching (postinstall runs `prisma generate`).
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production \
    DATABASE_URL=file:/data/assignai.db \
    STORAGE_DIR=/data/storage \
    PORT=3000
VOLUME ["/data"]
EXPOSE 3000

CMD ["sh", "scripts/docker-start.sh"]
