# Web Intelligence MCP Server - Apify Actor Dockerfile

FROM node:20-slim

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libharfbuzz0b \
    libnss3 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built app
COPY dist ./dist
COPY .actor ./.actor

# Expose port (Apify sets APIFY_WEB_SERVER_PORT)
EXPOSE 3000

# Start the Actor
CMD ["npm", "start"]
