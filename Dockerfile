FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ git \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

RUN useradd -m sandbox

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . . 

USER sandbox 

CMD ["node", "index.js"]