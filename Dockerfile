FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY src ./src
COPY types ./types
COPY tsconfig.json tsconfig.build.json ./
RUN npx prisma generate
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npx", "tsx", "src/server.ts"]
