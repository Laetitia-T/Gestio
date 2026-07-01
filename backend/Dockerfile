# Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production
FROM node:20-alpine AS production

WORKDIR /app

# Met à jour les packages système pour corriger les CVE Alpine
RUN apk upgrade --no-cache


# On ne copie que les dépendances de production
COPY package*.json ./
RUN npm ci --omit=dev

# On copie le JS compilé depuis le stage builder
COPY --from=builder /app/dist ./dist

# Utilisateur non-root pour la sécurité
RUN addgroup -S gestio && adduser -S gestio -G gestio
USER gestio

EXPOSE 4000

CMD ["node", "dist/server.js"]
