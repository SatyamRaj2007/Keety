FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN chmod +x ./scripts/start.sh ./scripts/healthcheck.sh \
    && mkdir -p /app/logs \
    && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["./scripts/start.sh"]
