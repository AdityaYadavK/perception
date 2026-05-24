FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    PRISMA_HIDE_UPDATE_MESSAGE=true

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --include=dev --omit=optional --no-audit --no-fund \
    && npm cache clean --force \
    && chown -R node:node /app

COPY --chown=node:node prisma ./prisma
COPY --chown=node:node src ./src

EXPOSE 3000

USER node

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node --import tsx src/server.ts"]
