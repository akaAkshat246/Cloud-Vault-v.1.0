FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/crypto-spec/package*.json ./packages/crypto-spec/

RUN npm install

# Copy source code
COPY backend/ ./backend/
COPY packages/crypto-spec/ ./packages/crypto-spec/

# Build crypto-spec and backend
RUN npm run build --workspace=@cloudvault/crypto-spec
RUN npm run build --workspace=@cloudvault/backend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/crypto-spec/package*.json ./packages/crypto-spec/

RUN npm install --omit=dev

COPY --from=builder /app/packages/crypto-spec/dist ./packages/crypto-spec/dist
COPY --from=builder /app/backend/dist ./backend/dist

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "dist/index.js"]

