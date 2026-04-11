# =============================================================================
# Stage 1: Build the React frontend
# =============================================================================
FROM node:20-slim AS frontend-builder

WORKDIR /frontend-build

# Install dependencies first (better Docker layer caching)
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source and build
# No VITE_BASE_URL → base defaults to "/" (Render serves from root)
COPY frontend/ ./
RUN npm run build


# =============================================================================
# Stage 2: Python backend + compiled frontend
# =============================================================================
FROM python:3.11-slim

# Install system dependencies for Chrome and Selenium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libxkbcommon0 \
    fonts-liberation \
    libappindicator3-1 \
    lsb-release \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN curl -sSL https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o chrome.deb \
    && apt-get update && apt-get install -y ./chrome.deb \
    && rm chrome.deb

# Set the working directory
WORKDIR /app

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install SeleniumBase drivers
RUN sbase install chromedriver

# Copy the backend source code
COPY backend/ .

# Copy the compiled React app from Stage 1 → FastAPI will serve it from /app/static/
COPY --from=frontend-builder /frontend-build/dist ./static

# Expose the port
EXPOSE 8001

# Start the server
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
