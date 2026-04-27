FROM node:18-alpine
WORKDIR /app
COPY package.json insecure-server.js ./
RUN npm install
CMD ["node", "insecure-server.js"]