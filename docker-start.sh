#!/bin/bash
# REACH+ Docker Quick Start Script

set -e

echo "=================================================="
echo "🐳 REACH+ Docker Deployment"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "   Creating from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ .env file created"
        echo "⚠️  Please edit .env and add your API keys:"
        echo "   - OPENAI_API_KEY (required)"
        echo "   - TWITTER_* keys (optional)"
        echo ""
        read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
    else
        echo "❌ ERROR: env.example not found!"
        exit 1
    fi
fi

echo "📋 Checking configuration..."
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  WARNING: OPENAI_API_KEY not configured in .env"
    echo "   Please add your OpenAI API key to .env file"
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

echo ""
echo "🏗️  Building Docker images (this may take 5-10 minutes)..."
echo ""

# Build images
docker compose build

echo ""
echo "🚀 Starting containers..."
echo ""

# Start containers
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Wait for health
max_wait=60
elapsed=0
while [ $elapsed -lt $max_wait ]; do
    if docker compose ps | grep -q "healthy"; then
        echo "✅ Services are healthy!"
        break
    fi
    echo "   Waiting... ($elapsed/$max_wait seconds)"
    sleep 5
    elapsed=$((elapsed + 5))
done

if [ $elapsed -ge $max_wait ]; then
    echo "⚠️  WARNING: Services did not become healthy in time"
    echo "   Check logs with: docker compose logs"
fi

echo ""
echo "=================================================="
echo "✅ REACH+ is running!"
echo "=================================================="
echo ""
echo "📍 Access URLs:"
echo "   🌐 Web Interface: http://localhost:5001"
echo "   🔌 API Health:    http://localhost:5001/api/health"
echo ""
echo "🔧 Useful Commands:"
echo "   📊 View logs:       docker compose logs -f"
echo "   🛑 Stop:            docker compose down"
echo "   🔄 Restart:         docker compose restart"
echo "   📈 Stats:           docker stats"
echo "   🔍 Status:          docker compose ps"
echo ""
echo "📖 Full documentation: DOCKER_DEPLOYMENT.md"
echo ""
echo "=================================================="

