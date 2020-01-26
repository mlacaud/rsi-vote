FROM node:11-alpine

COPY package*.json ./

RUN npm install

COPY index.js ./
COPY swagger/ ./swagger/

ENTRYPOINT ["node", "index"]
