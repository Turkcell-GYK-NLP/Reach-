#!/bin/bash
# REACH+ Docker Stop Script

echo "=================================================="
echo "🛑 Stopping REACH+ Docker Containers"
echo "=================================================="
echo ""

docker compose down

echo ""
echo "✅ All containers stopped"
echo ""
echo "🗑️  To also remove volumes (database data):"
echo "   docker compose down -v"
echo ""
echo "🔄 To restart later:"
echo "   docker compose up -d"
echo "   or: ./docker-start.sh"
echo ""

