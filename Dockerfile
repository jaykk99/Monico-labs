FROM node:20-slim

# Install Chromium and all deps needed for headless Chrome
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell puppeteer to skip downloading bundled Chrome — use system Chromium instead
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Puppeteer will try to find the executable in common locations.
# If it's not found, it might still fall back to downloading.
# Explicitly setting PUPPETEER_EXECUTABLE_PATH is generally safer if the path is known and stable.
# For Debian-based systems, /usr/bin/chromium is typically correct for the 'chromium' package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build the app
COPY . .
RUN npm run build

# Cloud hosts inject PORT automatically
EXPOSE 3000

CMD ["npm", "run", "start"]