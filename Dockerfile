# Multi-stage Dockerfile for REACH+ Application
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Install Python for build-time scripts
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application (frontend + backend)
RUN npm run build

# Note: Not pruning devDependencies because some are needed at runtime (e.g. vite for dev mode fallback)

# Stage 2: Python dependencies and FAISS indexer
FROM python:3.11-slim AS python-builder

WORKDIR /python-app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Force rebuild cache - updated requirements.txt
RUN echo "Build cache updated: $(date)" > /tmp/build_info.txt

# Copy Python scripts
COPY database.py faiss_indexer.py ilkyardim_indexer.py tarife_onerisi_sistemi.py ./
COPY Datas ./Datas
COPY new_datas ./new_datas
COPY guncel_tarifeler_2025*.json ./

# Stage 3: Production runtime
FROM node:20-alpine AS runtime

# Install Python 3 for runtime Python scripts
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    postgresql-client \
    postgresql-dev \
    gcc \
    musl-dev \
    curl \
    build-base \
    linux-headers

# Install Python dependencies at runtime using virtual environment
COPY requirements.txt ./
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --only-binary=all -r requirements.txt

WORKDIR /app

# Copy Node.js dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Copy Python environment from python-builder
COPY --from=python-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-builder /python-app /python-app

# Copy necessary files for runtime
COPY migrations ./migrations
COPY shared ./shared
COPY Datas ./Datas
COPY new_datas ./new_datas
COPY faiss_index ./faiss_index
COPY database.py ./
COPY faiss_indexer.py ./
COPY ilkyardim_indexer.py ./
COPY faiss_search.py ./
COPY ilkyardim_search.py ./
COPY tarife_onerisi_sistemi.py ./
COPY guncel_tarifeler_2025*.json ./
COPY usage_with_recommendations.xlsx ./
COPY hospital_api ./hospital_api

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create necessary directories
RUN mkdir -p faiss_index logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

