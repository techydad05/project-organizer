FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ curl
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache python3 make g++ curl
COPY --from=builder /app/build build/
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules/
# Rebuild native modules for the target platform
RUN npm rebuild better-sqlite3
RUN mkdir -p /app/data
EXPOSE 3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV ORIGIN=http://localhost:3000
ENV DATA_DIR=/app/data
CMD ["node", "build"]
