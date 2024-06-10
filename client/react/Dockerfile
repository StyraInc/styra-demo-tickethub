FROM node:21-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages packages
RUN mkdir -p node_modules
RUN ln -s ../packages/opa-react node_modules/opa-react
RUN ln -s ../packages/opa-wasm node_modules/opa-wasm
RUN npm install
RUN ls node_modules
RUN ls -ald node_modules/opa-react
RUN ls node_modules/opa-react
COPY src src
COPY public public
RUN npm run build

FROM caddy:latest
EXPOSE 4001
COPY --from=builder /app/build /usr/share/caddy/
COPY caddy/Caddyfile /etc/caddy/Caddyfile
