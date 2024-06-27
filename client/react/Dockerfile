FROM node:21-alpine AS builder
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json package-lock.json ./
COPY packages packages
RUN cd packages/opa-wasm && npm ci && npx tsc
RUN npm ci
COPY src src
COPY public public
RUN npm run build

FROM caddy:latest
EXPOSE 3000
COPY --from=builder /opt/app/build /usr/share/caddy/
COPY caddy/Caddyfile /etc/caddy/Caddyfile
