# ---- Base stage: install all deps (dev + prod) ----
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# ---- Dev stage: hot-reload with tsx ----
FROM base AS dev
ENV NODE_ENV=development
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Build stage: compile TypeScript ----
FROM base AS builder
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage: production image ----
FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --production --ignore-scripts \
  && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
# Seed demo data when the mock/in-memory DB is empty, then start.
CMD ["sh", "-c", "npm run db:seed && npm start"]
