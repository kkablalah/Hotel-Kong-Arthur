FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY openapi.yaml ./

EXPOSE 3000

CMD ["node", "src/app.js"]
