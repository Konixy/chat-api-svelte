FROM node:23.6-alpine AS chat-api-svelte

LABEL Developpers="Anatole Dufour"

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run prisma
RUN npm run build

RUN rm -rf src/ docker-compose.yml

USER node:node

CMD ["node", "dist"]
