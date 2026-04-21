FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

USER node

CMD ["node", "src/runner.js"]