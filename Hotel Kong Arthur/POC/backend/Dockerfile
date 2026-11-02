FROM node:26-slim

WORKDIR /app/backend

# Pakkerne installeres først, så Docker kan genbruge dem, når kun koden ændres.
# Udviklingspakker er med, så testene kan køre i containeren.
COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY tests ./tests

USER node
EXPOSE 8000
CMD ["node", "src/presentation/server.js"]
