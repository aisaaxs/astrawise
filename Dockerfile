FROM node:18-alpine AS base
RUN apk add --no-cache g++ make py3-pip libc6-compat openssl
WORKDIR /app
COPY package*.json ./
EXPOSE 3000

# Development Build
FROM base AS dev
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps
COPY . .
CMD npx prisma generate && npx prisma db push && npm run dev

# Production Build
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
RUN npm ci

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

CMD npx prisma generate && npx prisma migrate deploy && npm start