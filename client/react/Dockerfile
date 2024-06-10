FROM node:21-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages packages
RUN npm install
COPY src src
COPY public public
RUN npm run build

FROM caddy:latest
EXPOSE 4001
COPY --from=builder /app/build /usr/share/caddy/
COPY caddy/Caddyfile /etc/caddy/Caddyfile
