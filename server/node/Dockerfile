FROM node:21-alpine
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json package-lock.json prisma ./
RUN npm install
COPY src src
EXPOSE 4001
ENV SERVER_HOST "0.0.0.0"
CMD [ "npm", "start"]
